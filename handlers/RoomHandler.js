const uuid = require('uuid');
const Users = require('mongoose').model("Users");

// TODO: Use namespaces for different cafes
//  and change registeredRooms to object mapping from cafe to array of rooms
const registeredRooms = {};
const assignedIds = [];
module.exports = {
	init: function (io, socket) {
		socket.on('requestTables', function (data) {
			checkLogin(socket, (userId) => {
				const companyId = checkCompanyId(socket, data);
				if (!companyId) return;
				updateRoomsUnicast(socket, companyId);
			});
		});

		socket.on('addTable', function (data) {
			checkLogin(socket, (userId) => {
				const companyId = checkCompanyId(socket, data);
				if (!companyId) return;

				leaveRoom(socket, io, companyId);
				const roomId = generateId();
				if (!!registeredRooms[companyId] && registeredRooms[companyId] >= 8) {
					socket.emit('tableException', {message: 'The maximum of tables is reached!'});
					return;
				}
				assignedIds.push(roomId);
				socket.emit('addedTable', {tableId: roomId});
			});
		});

		socket.on('joinTable', function (data) {
			checkLogin(socket, (userId) => {
				if (typeof data === 'undefined' || typeof data.tableId === 'undefined') {
					socket.emit('tableException', {message: 'Request parameters are empty. Please select a table!'});
					return;
				}

				const companyId = checkCompanyId(socket, data);
				if (!companyId) return;

				const roomId = data.tableId;
				const sockets = io.of("/").in().adapter.rooms[roomId];
				if (!assignedIds.includes(roomId) && (typeof sockets === 'undefined' || sockets.length < 1)) {
					socket.emit('tableException', {message: 'The requested table does not exist! Please try another one!'});
					return;
				}
				if (!!sockets && sockets.length >= 8) {
					socket.emit('tableException', {message: 'This table is already full. Please choose another one!'});
					return;
				}

				const index = assignedIds.indexOf(roomId);
				if (index >= 0) {
					assignedIds.splice(index, 1);
				}

				if (roomId === leaveRoom(socket, io, companyId)) {
					// User clicked same room => do not join again and update others
					updateRoomsBroadcast(io, socket, companyId);
				} else {
					joinRoom(io, socket, roomId, companyId, userId);
				}
			});
		});

		socket.on('leaveTable', function () {
			leaveAndUpdateRooms(socket, io, socket.companyId);
		});

	},

	handleDisconnect: function (io, socket) {
		leaveAndUpdateRooms(socket, io, socket.companyId);
	}
}

function getRooms(companyId) {
	return registeredRooms[companyId] || {};
}

function updateRoomsUnicast(socket, companyId) {
	socket.emit('updateTables', getRooms(companyId));
}

function updateRoomsBroadcast(io, socket, companyId) {
	socket.broadcast.emit('updateTables', getRooms(companyId));
}

function joinRoom(io, socket, roomId, companyId, userId) {
	socket.room = roomId;
	socket.companyId = companyId;
	socket.join(roomId);
	if (!registeredRooms[companyId]) {
		registeredRooms[companyId] = {};
	}
	if (!registeredRooms[companyId][roomId]) {
		const room = io.of("/").in().adapter.rooms[roomId];
		room.prefixName = getRoomName(Object.values(registeredRooms[companyId]));
		room.participants = [userId]
		registeredRooms[companyId][roomId] = room;
	} else {
		registeredRooms[companyId][roomId].participants.push(userId);
	}
	socket.emit('joinedTable', {'tableId': roomId, 'tables': getRooms(companyId)});
	updateRoomsBroadcast(io, socket, companyId);
}

function leaveAndUpdateRooms(socket, io, companyId) {
	leaveRoom(socket, io, companyId);
	updateRoomsBroadcast(io, socket, companyId);
}

function leaveRoom(socket, io, companyId) {
	const roomId = socket.room;
	socket.room = null;
	socket.companyId = null;
	if (!!roomId) {
		socket.leave(roomId);
		let room = io.of("/").in().adapter.rooms[roomId];
		// Check if room is empty
		if (typeof room === "undefined" && typeof registeredRooms[companyId][roomId] !== 'undefined') {
			// If so, remove it from memory
			delete registeredRooms[companyId][roomId];
		}
		socket.emit('leftTable', getRooms(companyId));
		return roomId;
	}
	return -1;
}

function generateId() {
	return uuid.v4();
}

function getRoomName(rooms) {
	const chosenNames = rooms.map(r => r.prefixName);
	const difference = [
		"Ark",
		"Tak",
		"Chao",
		"Elas",
		"Gene",
		"Mys",
		"Prak",
		"Optimis",
		"Realis",
		"Gigan",
		"Kri",
		"Fantas",
		"Hek",
		"Poli",
		"Pragma",
		"Gespens",
		"Klima",
		"Automa",
		"Theore",
		"Quadra",
		"Aroma",
		"Akus",
		"Plas",
		"Athle",
		"Ästhe",
		"Exo",
		"Demokra",
		"Energe",
		"Galak",
		"Bio",
		"Stochas"].filter(x => !chosenNames.includes(x));
	return difference[Math.floor(Math.random() * difference.length)];
}

function checkLogin(socket, callback) {
	socket.handshake.session.reload(function (err) {
		if (!!err) {
			console.log(err);
			return;
		}
		if (!socket.handshake.session.userId) {
			console.log("User not logged in");
			return;
		}
		callback(socket.handshake.session.userId);
	});
}

function checkCompanyId(socket, data) {
	if (!data) {
		socket.emit('tableException', {message: 'Payload is empty!'});
		return false;
	}
	if (!data.companyId) {
		socket.emit('tableException', {message: 'Sorry. No company ID given.'});
		return false;
	}
	return data.companyId;
}

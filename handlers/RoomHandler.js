const uuid = require('uuid');
const Users = require('mongoose').model("Users");

// TODO: Use namespaces for different cafes
//  and change registeredRooms to object mapping from cafe to array of rooms
const registeredRooms = {};
const assignedIds = [];
module.exports = {
	init: function (io, socket) {
		socket.on('requestTables', function () {
			socket.handshake.session.reload(function (err) {
				console.log(err);
				// TODO: Handle Error
				updateRoomsUnicast(socket);
				Users.findById(socket.handshake.session.userId).then(u => console.log(u, "requests table"));
			});
		});

		socket.on('addTable', function () {
			if (Object.keys(registeredRooms).length >= 8) {
				socket.emit('tableException', {message: 'Sorry. there are no tables left.'});
				return;
			}
			leaveRoom(socket, io);
			const roomId = generateId();
			assignedIds.push(roomId);
			socket.emit('addedTable', {tableId: roomId});
		});

		socket.on('joinTable', function (data) {
			if (typeof data === 'undefined' || typeof data.tableId === 'undefined') {
				socket.emit('tableException', {message: 'Request parameters are empty. Please select a table!'});
				return;
			}
			const roomId = data.tableId;
			const sockets = io.of('/').in().adapter.rooms[roomId];
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

			if (roomId === leaveRoom(socket, io)) {
				// User clicked same room => do not join again and update others
				updateRoomsBroadcast(socket);
			} else {
				joinRoom(io, socket, roomId);
			}
		});

		socket.on('leaveTable', function () {
			leaveAndUpdateRooms(socket, io);
		});

	},

	handleDisconnect: function (io, socket) {
		leaveAndUpdateRooms(socket, io);
	}
}

function getRooms() {
	return registeredRooms;
}

function updateRoomsUnicast(socket) {
	socket.emit('updateTables', getRooms());
}

function updateRoomsBroadcast(socket) {
	socket.broadcast.emit('updateTables', getRooms());
}

function joinRoom(io, socket, roomId) {
	socket.room = roomId;
	socket.join(roomId);
	if (typeof registeredRooms[roomId] === 'undefined') {
		const room = io.of('/').in().adapter.rooms[roomId];
		registeredRooms[roomId] = room;
	}
	socket.emit('joinedTable', {'tableId': roomId, 'tables': getRooms()});
	updateRoomsBroadcast(socket);
}

function leaveAndUpdateRooms(socket, io) {
	leaveRoom(socket, io);
	updateRoomsBroadcast(socket);
}

function leaveRoom(socket, io) {
	const roomId = socket.room;
	if (!!roomId) {
		socket.room = null;
		socket.leave(roomId);
		let room = io.of('/').in().adapter.rooms[roomId];
		// Check if room is empty
		if (typeof room === "undefined" && typeof registeredRooms[roomId] !== 'undefined') {
			// If so, remove it from memory
			delete registeredRooms[roomId];
		}
		socket.emit('leftTable', getRooms());
		return roomId;
	}
	return -1;
}

function generateId() {
	return uuid.v4();
}

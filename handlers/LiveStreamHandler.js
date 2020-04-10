const helpers = require("./helpers")

module.exports = {
	init: function (io, socket) {
		socket.on("joinLiveStream", function (data) {
				helpers.checkLogin(socket, (userId) => {
					helpers.getUser(userId, (user) => {
						joinChatRoom(user, io, socket, data);
					});
				});
			}
		);

		socket.on("chatMessage", function (data) {
			helpers.checkLogin(socket, (userId) => {
				helpers.getUser(userId, (user) => {
					sendChatMessage(user, io, socket, data);
				});
			});
		});

		socket.on("leaveLiveStream", function () {
			leaveChatRoom(io, socket);
		})
	},

	handleDisconnect(io, socket) {
		leaveChatRoom(io, socket);
	}
}

function joinChatRoom(user, io, socket, data) {
	leaveChatRoom(io, socket);
	if (!data.liveStreamId) {
		socket.emit('liveStreamException', {message: "No live stream ID given."})
	}
	// TODO: Verify that chat ID is valid and stream is currently/soon live
	let roomId = data.liveStreamId;
	socket.join(roomId);
	socket.chatRoom = roomId;
	const sockets = io.of("/").in().adapter.rooms[roomId];
	const userRepresentation = getUserRepresentation(user, socket);
	const participantCount = sockets.length;
	io.of('/').to(roomId).emit('joinedLiveStream', {participantCount: participantCount, user: userRepresentation});
}

function sendChatMessage(user, io, socket, data) {
	checkUserRoom(socket, (roomId) => {
		// TODO: Check if message does not contain swear words
		const userRepresentation = getUserRepresentation(user, socket);
		const text = data.text;
		if (!text) return;
		io.of('/').to(roomId).emit('chatMessage', {
			user: userRepresentation,
			message: text,
			className: null
		});
	});
	// Step 3: Emit message to everyone in the room
}

function leaveChatRoom(io, socket) {
	checkUserRoom(socket, (roomId) => {
		socket.leave(roomId);
		socket.chatRoom = null;
		const sockets = io.of("/").in().adapter.rooms[roomId];
		if (!sockets) {
			console.log("Chatroom with ID", roomId, "does not exist");
			return;
		}
		const participantCount = sockets.length;
		io.of('/').to(roomId).emit('leftLiveStream', {participantCount: participantCount});
	});
}

function checkUserRoom(socket, callback) {
	const roomId = socket.chatRoom;
	if (!roomId) return;
	callback(roomId);
}

function getUserRepresentation(user, socket) {
	const userRepresentation = {
		name: user.name,
		avatarUrl: user.avatarUrl,
		socketId: socket.id
	}
	return userRepresentation;
}

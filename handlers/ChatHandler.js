const helpers = require("./helpers")

module.exports = {
	init: function (socket, io) {
		socket.on("joinChat", function (data) {
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

		socket.on("leaveChat", function () {
			leaveChatRoom(socket);
		})
	},

	handleDisconnect(io, socket) {
		leaveChatRoom(io, socket);
	}
}

function joinChatRoom(user, io, socket, data) {
	// TODO
}

function sendChatMessage(user, io, socket, data) {
	// TODO
}

function leaveChatRoom(io, socket) {
	const roomId = socket.chatRoom;
	if (!roomId) {
		console.log("Error: Chatroom ID not defined for", socket.id);
		return;
	}
	socket.leave(roomId);
	socket.chatRoom = null;
	const sockets = io.of("/").in().adapter.rooms[roomId];
	if (!sockets) {
		console.log("Error: Chatroom with ID", roomId, "does not exist");
		return;
	}
	const participantCount = sockets.length;
	io.of('/').to(roomId).emit('left', {participantCount: participantCount});
}

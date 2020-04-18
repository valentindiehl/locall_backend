const helpers = require("./helpers");
const urlMatcher = new RegExp("^(http:\\/\\/www\\.|https:\\/\\/www\\.|http:\\/\\/|https:\\/\\/)?[a-z0-9]+([\\-.]{1}[a-z0-9]+)*\\.[a-z]{2,5}(:[0-9]{1,5})?(\\/.*)?$");


module.exports = {
	init: function (io, socket) {
		socket.on("joinLiveStream", function (data) {
			joinChatRoom(io, socket, data);
		});

		socket.on("chatMessage", function (data) {
			chatMessage(socket, io, data, null);
		});

		socket.on("leaveLiveStream", function () {
			leaveChatRoom(io, socket);
		})
	},

	handleDisconnect(io, socket) {
		leaveChatRoom(io, socket);
	}
}

function joinChatRoom(io, socket, data) {
	leaveChatRoom(io, socket);
	if (!data.liveStreamId) {
		socket.emit('liveStreamException', {message: "No live stream ID given."})
	}
	// TODO: Verify that chat ID is valid and stream is currently/soon live
	let roomId = data.liveStreamId;
	socket.join(roomId);
	socket.chatRoom = roomId;
	const sockets = io.of("/").in().adapter.rooms[roomId];
	const participantCount = sockets.length;
	io.of('/').to(roomId).emit('joinedLiveStream', {participantCount: participantCount});
	chatMessage(socket, io, {text: "ist beigetreten!"}, "joined");
}

function chatMessage(socket, io, data, className) {
	helpers.checkLogin(socket, (userId) => {
		helpers.getUser(userId, (user) => {
			sendChatMessage(user, io, socket, data, className);
		});
	});
}

function sendChatMessage(user, io, socket, data, className) {
	checkUserRoom(socket, (roomId) => {
		const userRepresentation = getUserRepresentation(user, socket);
		if (user.blockedMessageCount >= 3) {
			socket.emit("chatBlocked", {user: userRepresentation});
			return;
		}
		let text = data.text;
		if (!text) return;
		if (isBadText(text)) {
			helpers.blockMessage(user._id, roomId, text, () => {
				user.blockedMessageCount = !user.blockedMessageCount ? 1 : user.blockedMessageCount + 1;
				user.save().then(broadCastMessage(io, roomId, userRepresentation, "Nachricht wurde blockiert.", "blocked"));
			});
		} else {
			broadCastMessage(io, roomId, userRepresentation, text, className);
		}
	});
}

function broadCastMessage(io, roomId, userRepresentation, text, className) {
	io.of('/').to(roomId).emit('chatMessage', {
		user: userRepresentation,
		message: text,
		className: className
	});
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
	return {
		name: user.name,
		avatarUrl: user.avatarUrl,
		socketId: socket.id
	};
}

function isBadText(text) {
	// Check bad words
	if (helpers.hasSwearWords(text)) return true;
	// Check URL
	return !!urlMatcher.exec(text);

}

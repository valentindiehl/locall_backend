module.exports = {
	init: function (io, socket) {
		socket.on('mute', function () {
			sendMuteSignalToRoom(io, socket, true);

		});

		socket.on('unmute', function () {
			sendMuteSignalToRoom(io, socket, false);
		});
	}
}

function sendMuteSignalToRoom(io, socket, mute) {
	const roomId = socket.room;
	if (!roomId) return;
	const room = io.of("/").in().adapter.rooms[roomId];
	if (!room) return;
	const participant = room.participants[socket.id];
	if (!participant) return;
	room.participants[socket.id].muted = mute;
	io.of('/').to(roomId).emit(mute ? 'participantMute' : 'participantUnmute', {socketId: socket.id});
}

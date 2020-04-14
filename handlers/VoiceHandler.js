/**
 * Documentation to the events declared here, can be found here:
 * https://locall.atlassian.net/l/c/NUzmrM12
 */

module.exports = {
	init: function (io, socket) {
		socket.on('mute', function () {
			sendMuteSignalToRoom(io, socket, true);
		});

		socket.on('unmute', function () {
			sendMuteSignalToRoom(io, socket, false);
		});

		socket.on('speaking', function () {
			sendSpeakingSignalToRoom(io, socket, true);
		});

		socket.on('stoppedSpeaking', function () {
			sendSpeakingSignalToRoom(io, socket, false);
		})
	}
}

function sendMuteSignalToRoom(io, socket, mute) {
	checkParticipant(io, socket, (roomId, _, participant) => {
		participant.muted = mute;
		io.of('/').to(roomId).emit(mute ? 'participantMute' : 'participantUnmute', {socketId: socket.id});
	});

}

function sendSpeakingSignalToRoom(io, socket, speaking) {
	checkParticipant(io, socket, (roomId, _, participant) => {
		participant.speaking = speaking;
		io.of('/').to(roomId).emit(speaking ? 'participantSpeaking' : 'participantStoppedSpeaking', {socketId: socket.id});
	});
}

function checkParticipant(io, socket, callback) {
	const roomId = socket.room;
	if (!roomId) {
		console.log("Error: Room id not defined for socket", socket.id);
		return;
	}
	const room = io.of("/").in().adapter.rooms[roomId];
	if (!room) {
		console.log("Error: No room for given id", roomId);
		return;
	}
	const participant = room.participants[socket.id];
	if (!participant) {
		console.log("Error: The participant is not in the room");
		return;
	}
	callback(roomId, room, participant);
}

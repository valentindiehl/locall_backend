module.exports = {
	init: function (io, socket) {
		socket.on('mute', function () {
			const room = socket.room;
			if (!room) return;
			io.of('/').to(room).emit('mute', {socketId: socket.id});
		});

		socket.on('unmute', function () {
			const room = socket.room;
			if (!room) return;
			io.of('/').to(room).emit('unmute', {socketId: socket.id});
		});
	}
}

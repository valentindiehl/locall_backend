module.exports = {
	init: function (io, socket) {
		socket.on('signal', function (data) {
			console.log(socket.room);
			io.to(`${data.receiverSocket}`).emit('signal', {
				signal: data.signal,
				senderSocket: socket.id
			});
		});
	}
}

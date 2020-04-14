/**
 * Documentation to the events declared here, can be found here:
 * https://locall.atlassian.net/l/c/wq1y1o93
 */

module.exports = {
	init: function (io, socket) {
		socket.on('signal', function (data) {

			io.to(`${data.receiverSocket}`).emit('signal', {
				signal: data.signal,
				senderSocket: socket.id
			});
		});
	}
}

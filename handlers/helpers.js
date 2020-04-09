const mongoose = require("mongoose");
const Users = mongoose.model("Users");

module.exports = {
	checkLogin: function (socket, callback) {
		socket.handshake.session.reload(function (err) {
			if (!!err) {
				console.debug(err);
				return;
			}
			if (!socket.handshake.session.userId) {
				console.debug("User not logged in");
				return;
			}
			callback(socket.handshake.session.userId);
		});
	},

	getUser: function (userId, callback) {
		Users.findById(userId).then((user) => {
			if (!user) {
				console.log("No user found for ID", id);
				return;
			}
			callback(user);
		}).catch(console.log);
	}
}

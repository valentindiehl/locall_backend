const mongoose = require("mongoose");
const Users = mongoose.model("Users");
const BlockedMessages = mongoose.model("BlockedMessages");
const badWords = require("../data/badWords").words;

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
				console.log("No user found for ID", userId);
				return;
			}
			callback(user);
		}).catch(console.log);
	},

	blockMessage: function (userId, eventId, text, callback) {
		new BlockedMessages({
			userId: userId,
			eventId: eventId,
			message: text
		}).save().then(callback).catch(console.log);
	},

	tokenize: function (phrase) {
		// After https://github.com/thisandagain/washyourmouthoutwithsoap/
		phrase = phrase
			.toLowerCase()
			.replace(/[\s+]+/g, ' ');
		const withPunctuation = phrase
			.replace('/ {2,}/', ' ')
			.split(' ');
		const withoutPunctuation = phrase
			.replace(/[^\w\s]/g, '')
			.replace('/ {2,}/', ' ')
			.split(' ');

		return withPunctuation.concat(withoutPunctuation);
	},

	hasSwearWords: function (phrase) {
		const tokens = this.tokenize(phrase);
		for (let i in tokens) {
			// noinspection JSUnfilteredForInLoop
			if (badWords.indexOf(tokens[i]) >= 0) return true;
		}
		return false;
	}
}

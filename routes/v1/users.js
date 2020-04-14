const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const helpers = require('./helpers');
const Users = mongoose.model('Users');

router.use(passport.initialize());
router.use(passport.session());

router.get('/:id', auth.required, (req, res, next) => {
	console.debug(req.params.id);
	Users.findById(req.params.id)
		.then(function (matchingUser) {
			if (!matchingUser) return res.status(404).json(helpers.ErrorObject(404, "User not found"));
			return res.status(200).json({user: {name: matchingUser.name, image: matchingUser.avatarUrl}});
		})
		.catch(function (err) {
			/* istanbul ignore next */
			return res.status(500).json(helpers.ErrorObject(500, "internal error."));
		})
});

module.exports = router;

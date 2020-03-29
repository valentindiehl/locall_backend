const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('Users');
const axios = require('axios');

router.post('/landing', auth.optional, (req, res, next) => {
	const {body: {user}} = req;

	if (!user.email) {
		return res.status(422).json({
			errors: {
				email: 'is required',
			},
		});
	}
	axios.post('https://us19.api.mailchimp.com/3.0/lists/63f0ee09c6/members', {
			email_address: user.email,
			status: "pending",
			merge_fields: {
				"BNAME": user.name
			}
		},
		{
			headers: {
				'Content-Type': 'application/json'
			},
			auth: {
				username: "locall_map",
				password: process.env.MAILCHIMP_API_KEY
			}
		},
	)
		.then((data) => {
			console.log("Addded user");
			let segment_id = user.type === 'user' ? "1812935" : "1812939";
			axios.post('https://us19.api.mailchimp.com/3.0/lists/63f0ee09c6/segments/' + segment_id + '/members', {
					email_address: user.email,
				},
				{
					auth: {
						username: "locall_map",
						password: process.env.MAILCHIMP_API_KEY
					}
				})
				.then((data) => {
					console.log("Addded user tags");
					res.status(200);
					res.json({message: "Success. Please check E-mail"});
				})
				.catch((err) => {
					res.status(200);
					console.log(err);
					res.json(({message: err.message}));
				});
		})
		.catch((err) => {
			res.status(200);
			console.log(err);
			res.json(({message: err.message}));
		})
});

router.post('/', auth.optional, (req, res, next) => {
	const {body: {user}} = req;


	if (!user.email) {
		return res.status(422).json({
			errors: {
				email: 'is required',
			},
		});
	}

	if (!user.password) {
		return res.status(422).json({
			errors: {
				password: 'is required',
			},
		});
	}

	Users.findOne({email: user.email}, (err, matchingUser) => {
		if (err) {
			console.log(err);
		}
		if (matchingUser != null) {
			console.log("Duplicate user... doing nothing");
			return res.json({message: "E-Mail-Verification required. Message sent."});
		}
		const finalUser = new Users(user);

		finalUser.setPassword(user.password);
		const OptToken = finalUser.generateOptInToken(user.email);

		return finalUser.save()
			.then(() => {
				axios.post('https://api.sendinblue.com/v3/smtp/email', {
					to: [
						{
							email: user.email,
							name: user.name,
						}
					],
					templateId: 1,
					params: {
						firstname: user.name,
						link: process.env.FRONT_URL + "/verify-email/" + OptToken
					}
				}, {
					headers: {
						"api-key": process.env.SENDINBLUE_KEY
					}
				}).then((data) => res.json({message: "E-Mail-Verification required. Message sent."})
				).catch((err) => res.status(500).json({message: "registration failed.", code: err}));
			});
	});
});

router.get('/verifyEmail', auth.optional, (req, res, next) => {
	Users.findOne({optInToken: req.query.token}, function (err, user) {
		if (err) {
			return console.error(err);
		}
		console.dir(user);

		user.isOptedIn = true;
		user.save(function (err) {
			if (err) return console.error(err);
			console.log('succesfully updated user');
			console.log(user);

			return res.send(user);
		});
	});
});

router.post('/login', auth.optional, (req, res, next) => {
	const {body: {user}} = req;
	console.log(user);


	if (!user.email) {
		return res.status(422).json({
			errors: {
				email: 'is required',
			},
		});
	}

	if (!user.password) {
		return res.status(422).json({
			errors: {
				password: 'is required',
			},
		});
	}

	return passport.authenticate('local', {session: false}, (err, passportUser, info) => {
		if (err) {
			return next(err);
		}
		console.log(passportUser);

		if (passportUser) {
			console.log("passport user");
			const user = passportUser;

			if (!user.isOptedIn) {
				return res.status(400).json({
					message: "Login failed. Please check data."
				})
			}

			user.token = passportUser.generateJWT();
			res.cookie('token', user.token, {httpOnly: true});
			req.session.userId = user._id;
			return res.json({user: user.toAuthJSON()});
		}
		console.log("No passport user");

		return res.status(400).json({
			error: {
				message: 'Bad request'
			}
		});
	})(req, res, next);
});

router.post('/resetPassword', auth.optional, (req, res) => {
	const {body: {user}} = req;
	Users.findOne({email: user.email}, function (err, user) {
		if (err) {
			console.log(err);
			return res.status(500).json({message: "Internal error. Please try again later."});
		}
		if (user != null) {
			const token = user.generatePasswordResetToken();
			user.save()
				.then(() => {
					axios.post('https://api.sendinblue.com/v3/smtp/email', {
						to: [
							{
								email: user.email,
								name: user.name,
							}
						],
						templateId: 2,
						params: {
							link: process.env.FRONT_URL + "/reset-password/" + token
						}
					}, {
						headers: {
							"api-key": process.env.SENDINBLUE_KEY
						}
					}).catch((err) => res.status(500).json({message: "reset failed.", code: err}));
				});
		}
		return res.status(200).json({message: "If email is registered, you will receive instructions soon via mail."});
	})
});

router.post('/setPassword', auth.optional, (req, res) => {
	const {body: {user}} = req;

	if (user.token === undefined) return res.status(400).json({message: 'No token found. Please provide a valid reset token.'});

	Users.findOne({resetPasswordToken: user.token}, function (err, matchingUser) {
		if (err) return res.status(500).json({message: "Internal error. Please try again later.", code: err});

		if (matchingUser == null) return res.status(404).json({message: "User not found."});
		if (matchingUser.resetPasswordExpires <= Date.now()) return res.status(420).json({message: "Link expired. Please start password reset flow again."});

		matchingUser.setPassword(user.password);
		matchingUser.resetPasswordExpires = Date.now();
		matchingUser.resetPasswordToken = "";
		matchingUser.save()
			.then(() => res.status(200).json({message: "Password updated successfuly!"}));
	});
});

router.get('/current', auth.required, (req, res, next) => {
	const {payload: {id}} = req;

	return Users.findById(id)
		.then((user) => {
			if (!user) {
				return res.sendStatus(400);
			}

			return res.json({user: user.toAuthJSON()});
		});
});

router.get('/logout', auth.optional, (req, res, next) => {
	res.clearCookie('token');
	req.session.userId = null;
	return res.json({message: 'Logged out'});
});

router.get('/profile', auth.required, (req, res) => {
	const {payload: {id}} = req;

	return Users.findById(id)
		.then((user) => {
			if (!user) {
				return res.sendStatus(400);
			}

			return res.json({
				user: {
					email: user.email,
					id: user._id,
					name: user.name
				}
			})
		});
});

router.get('/check', auth.required, (req, res, next) => {
	console.log("Check successful");
	res.sendStatus(200);
});

module.exports = router;

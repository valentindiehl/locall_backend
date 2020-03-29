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
            console.log(err);
            return next(err);
        }

        if (passportUser) {

            const user = passportUser;

            if (!user.isOptedIn) {
                return res.status(403).json({
                    message: "Bitte bestätige zuerst deine E-Mail!"
                })
            }

            user.token = passportUser.generateJWT();
            res.cookie('token', user.token, {httpOnly: true});
            return res.json({user: user.toAuthJSON()});
        }

        return res.status(400).json({
            error: {
                message: 'Bad request'
            }
        });
    })(req, res, next);
});

router.post('/resetPassword', auth.optional, (req, res) => {
    const { body: {user} } = req;
    Users.findOne({email: user.email}, function(err, user) {
        if (err)
        {
            console.log(err);
            return res.status(500).json({ message: "Internal error. Please try again later."});
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
        return res.status(200).json({ message: "If email is registered, you will receive instructions soon via mail."});
    })
});

router.post('/setPassword', auth.optional, (req, res) => {
    const {body: {user}} = req;

    Users.findOne({resetPasswordToken: user.token}, function(err, matchingUser) {
       if (err) return res.status(500).json({message: "Internal error. Please try again later.", code: err});

       if (user == null) return res.status(409).json({message: "User not found."});

       if (matchingUser.resetPasswordExpires <= Date.now()) return res.status(420).json({ message: "Link expired. Please start password reset flow again."});

       if (user.password === user.passwordVerification) {
           matchingUser.setPassword(user.password);
           matchingUser.resetPasswordExpires = Date.now();
           matchingUser.resetPasswordToken = "";
           matchingUser.save()
               .then(() => res.status(200).json({message: "Password updated successfuly!"}));
       } else return res.status(400).json({message: "Passwords did not match."});
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
    return res.json({message: 'Logged out'});
});

router.get('/check', auth.required, (req, res, next) => {
    console.log("Check successful");
    res.sendStatus(200);
});

module.exports = router;
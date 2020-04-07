const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('Users');
const Businesses = mongoose.model('Businesses');
const axios = require('axios');
const helpers = require('./helpers');

router.use(passport.initialize());
router.use(passport.session());

/**
 * Registration Flow
 * Request 1: Create User
 */
router.post('/', auth.optional, (req, res) => {
    const {body: {account}} = req;
    let response = {};

    if (!account.email || !account.password) {
        return res.status(422).json(helpers.ErrorObject(422, "Missing fields!"));
    }

    Users.findOne({email: account.email}, (err, matchingUser) => {
        /* istanbul ignore next */
        if (err) {
            /* istanbul ignore next */
            return res.status(500).json(helpers.ErrorObject(500, "Internal error."));
        }
        if (matchingUser != null) {
            return res.status(202).json(helpers.AccountObject(matchingUser, ["_id", "email", "name"]));
        }

        /* istanbul ignore next */
        const finalUser = new Users(account);

        finalUser.setPassword(account.password);
        finalUser.isBusiness = false;
        finalUser.businessId = null;
        const OptToken = finalUser.generateOptInToken(account.email);

        return finalUser.save()
            .then(() => {
                const params = {
                    firstname: account.name,
                    link: process.env.FRONT_URL + "/verify-email/" + OptToken
                };
                helpers.sendEmail(account.email, account.name, 1, params)
                    .then((data) => res.status(202).json(helpers.AccountObject(finalUser, ["_id", "email", "name"])))
                    .catch((err) => {
                        /* istanbul ignore next */
                        res.status(500).json(helpers.ErrorObject(101, "Internal error."))
                    });
            });
    });
});


/**
 * Registration Flow
 * Step 2: Verify E-Mail
 */
router.post('/email-validation', auth.optional, (req, res) => {
    const {body: {account}} = req;

    Users.findOne({optInToken: account.token}, function (err, user) {
        /* istanbul ignore next */
        if (err) {
            /* istanbul ignore next */
            return console.error(err);
        }

        if (!user) return res.status(404).json(helpers.ErrorObject(404, "No matching user found."));

        /* istanbul ignore next */
        user.isOptedIn = true;
        user.save(function (err) {
            /* istanbul ignore next */
            if (err) return console.error(err);
            return res.send(user);
        });
    });
});

/**
 * Login Request
 */
router.post('/login', auth.optional, (req, res) => {
    const {body: {account}} = req;
    if (!account.email || !account.password) {
        return res.status(422).json(helpers.ErrorObject(422, "Missing fields!"));
    }
    return passport.authenticate('local', {session: false}, (err, passportUser) => {
        /* istanbul ignore next */
        if (err) {
            /* istanbul ignore next */
            return res.status(500).json(helpers.ErrorObject(500, "Internal error."));
        }
        console.log(account);
        if (passportUser) {
            const user = passportUser;

            if (!user.isOptedIn) {
                return res.status(200).json(helpers.ErrorObject(101, "Authentication failed"));
            }
            user.token = passportUser.generateJWT();
            res.cookie('token', user.token, {httpOnly: true});
            req.session.userId = user._id.toString();
            console.log(res.cookies);
            return res.json({account: user.toAuthJSON()});
        }
        return res.status(200).json(helpers.ErrorObject(101, "Authentication failed"));
    })(req, res);
});

/**
 * Password Change / Reset Flow
 */
router.patch('/password', auth.optional, (req, res) => {
    const {body: {account}} = req;
    if (account.email)
    {
        Users.findOne({email: account.email}, function (err, user) {
            /* istanbul ignore next */
            if (err) {
                /* istanbul ignore next */
                return res.status(500).json({message: "Internal error. Please try again later."});
                /* istanbul ignore next */
            }
            if (user) {
                const token = user.generatePasswordResetToken();
                user.save()
                    .then(() => {
                        const params = {
                            link: process.env.FRONT_URL + "/reset-password/" + token
                        };
                        helpers.sendEmail(user.email, user.name, 2, params)
                            .catch((err) => {
                                /* istanbul ignore next */
                                res.status(500).json(helpers.ErrorObject(500, "Internal error."))
                            });
                    });
            }
            return res.status(200).json({message: "If email is registered, you will receive instructions soon via mail."});
        })
    } else if (account.resetToken)
    {
        Users.findOne({resetPasswordToken: account.resetToken}, function (err, matchingUser) {
            /* istanbul ignore next */
            if (err) return res.status(500).json(helpers.ErrorObject(500, "Internal error"));
            if (!matchingUser) return res.status(404).json(helpers.ErrorObject(404, "No matching user found. Is your token correct?"));
            /* istanbul ignore next */
            if (matchingUser.resetPasswordExpires <= Date.now()) return res.status(420).json(helpers.ErrorObject(422, "Link expired. Please start password reset flow again."));

            matchingUser.setPassword(account.password);
            matchingUser.resetPasswordExpires = Date.now();
            matchingUser.resetPasswordToken = "";
            matchingUser.save()
                .then(() => res.status(200).json({message: "Password updated successfuly!"}));
        });
    } else if (account.oldPassword)
    {
        if (!req.cookies.token)
        {
            return res.status(401).json(helpers.ErrorObject(401, "No authorization token found."))
        }
        const {payload: {id}} = req;
        if (!account.password || !account.oldPassword) {
            return res.status(422).json({message: "Password is missing!"})
        }

        Users.findById(id)
            .then(function (matchingUser) {
                /* istanbul ignore next */
                if (!matchingUser) {
                    return res.status(400).json(helpers.ErrorObject(400, "Bad request."))
                }
                if (matchingUser.validatePassword(account.oldPassword)) {
                    matchingUser.setPassword(account.password);
                    matchingUser.save()
                        .then(() => {
                            return res.status(200).json({account: matchingUser.toAuthJSON()})
                        })
                } else return res.status(401).json(helpers.ErrorObject(401, "Authentication failed."));
            })/* istanbul ignore next */
            .catch(() => {
            /* istanbul ignore next */
            res.status(500).json(helpers.ErrorObject(500, "Internal error."))
        })
    } else res.status(400).json(helpers.ErrorObject(400, "Bad request"));
});

/**
 * Change Name Request
 */
router.patch('/name', auth.required, (req, res) => {
    const {payload: {id}} = req;
    const {body: {account}} = req;

    Users.findById(id)
        .then(function(matchingUser) {
            /* istanbul ignore next */
            if (!matchingUser) {
                /* istanbul ignore next */
                return res.status(400).json(helpers.ErrorObject(400, "Bad request."))
            }

            matchingUser.name = account.name;
            matchingUser.save()
                .then(() => {
                    return res.status(200).json( helpers.AccountObject(matchingUser, []))
                })
        }) /* istanbul ignore next */
        .catch(() => {
            /* istanbul ignore next */
            res.status(500).json(helpers.ErrorObject(500, "Internal error."))
        });
});

/**
 * Get own account data
 */
router.get('/', auth.required, (req, res) => {
   const {payload: {id}} = req;

   Users.findById(id)
       .then((account) => {
           return res.status(200).json(account);
       })
});

/**
 * Delete User Request
 */
router.delete('/', auth.required, (req, res) => {
    Users.deleteOne({_id: req.payload.id}, function(err) {
        /* istanbul ignore next */
        if (err)
        {
            /* istanbul ignore next */
            res.status(401).json({message: "Not authorized."});
        }
        res.clearCookie('token');
        res.status(200).json({message: "User deleted. Process"});
    });
});

/**
 * Get Own Business Data
 */
router.get('/business', auth.required, (req, res, next) => {
    const {payload: {id}} = req;

    Users.findById(id)
        .then((user) => {
            if (!user) return res.status(400).json(helpers.ErrorObject(400, "Bad request."));
            if (!user.isBusiness) return res.status(401).json(helpers.ErrorObject(401, "Not authorized to use business API."));

            Businesses.findOne({_id: user.businessId}, function(err, business) {
                /* istanbul ignore next */
                if (err)
                {
                    /* istanbul ignore next */
                    return res.status(500).json(helpers.ErrorObject(500, "Internal error."));
                }
                if (!business)
                {
                    /* istanbul ignore next */
                    return res.status(500).json(helpers.ErrorObject(500, "Internal error."));
                }
                return res.status(200).json(business);
            });
        })
        /* istanbul ignore next */
        .catch(() => {
            /* istanbul ignore next */
            return res.status(400).json(helpers.ErrorObject(500, "Internal error."));
        })
});

/**
 * Change Business Data
 */
router.patch('/business', auth.required, (req, res, next) => {
    const {payload: {id}} = req;
    const {body: {business}} = req;

    Users.findById(id)
        .then((user) => {
            if (!user) return res.status(400).json({message: 'Bad request.'});
            if (!user.isBusiness) return res.status(401).json({message: 'Not authorized for business API.'});

            Businesses.findOne({_id: user.businessId}, function(err, matchingBusiness) {
                /* istanbul ignore next */
                if (err) {
                    /* istanbul ignore next */
                    return res.status(500).json({message: "Internal error. Please try again later."});
                }
                /* istanbul ignore next */
                if (!matchingBusiness)
                {
                    /* istanbul ignore next */
                    return res.status(500).json({message: "Could not find your business. Please consult technical support"});
                }
                console.debug("temp: " + business);
                console.debug("db: " + matchingBusiness);
                if (business.paypal != null) matchingBusiness.paypal = business.paypal;
                if (business.description) matchingBusiness.message = business.description;

                matchingBusiness.save()
                    .then(() => res.status(200).json(matchingBusiness));
            });
        })
});


module.exports = router;

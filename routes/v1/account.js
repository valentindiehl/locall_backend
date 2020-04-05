const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('Users');
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
                    .catch((err) => res.status(500).json(helpers.ErrorObject(101, "Internal error.")));
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
        if (err) {
            /* istanbul ignore next */
            return console.error(err);
        }

        if (!user) return res.status(404).json(helpers.ErrorObject(404, "No matching user found."));

        /* istanbul ignore next */
        user.isOptedIn = true;
        user.save(function (err) {
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
        if (err) {
            /* istanbul ignore next */
            return res.status(500).json(helpers.ErrorObject(500, "Internal error."));
        }
        if (passportUser) {
            const user = passportUser;

            if (!user.isOptedIn) {
                return res.status(200).json(helpers.ErrorObject(400, "Login failed"));
            }
            user.token = passportUser.generateJWT();
            helpers.addCookie(user, req, res);
            return res.json({account: user.toAuthJSON()});
        }
        return res.status(200).json(helpers.ErrorObject(101, "Authentication failed"));
    })(req, res);
});

/**
 * Authenticated Password Change Flow
 */
router.patch('/password', auth.required, (req, res) => {
    const {payload: {id}} = req;
    const {body: {account}} = req;

    if (!account.password || !account.oldPassword) {
        return res.status(422).json({message: "Password is missing!"})
    }

    Users.findById(id)
        .then(function (matchingUser) {
            if (!matchingUser) {
                return res.status(400).json(helpers.ErrorObject(400, "Bad request."))
            }
            if (matchingUser.validatePassword(account.oldPassword)) {
                matchingUser.setPassword(account.password);
                matchingUser.save()
                    .then(() => res.status(200).json({account: matchingUser.toAuthJSON()}))
            } else return res.status(401).json(helpers.ErrorObject(401, "Authentication failed."));
        })
});

/**
 * Unauthenticated Password Change
 * Step 1: Send Recovery Email
 */
router.patch('/password', auth.optional, (req, res) => {

})

module.exports = router;

const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('Users');
const axios = require('axios');
const Error = require('./helpers');

router.use(passport.initialize());
router.use(passport.session());

function getOneByEmail(email, fields)
{
    Users.findOne({email: email}, (err, matchingUser) => {
        if (err) {

        }
    });
}

router.post('/', auth.optional, (req, res) => {
    const {body: {user}} = req;
    let response = {};

    if (!user.email || !user.password) {
        return res.status(422).json()
        ;
    }

    Users.findOne({email: user.email}, (err, matchingUser) => {
        if (err) {
            console.debug(err);
        }
        if (matchingUser != null) {
            console.debug("Duplicate user... doing nothing");
            return res.json({message: "E-Mail-Verification required. Message sent."});
        }
        const finalUser = new Users(user);

        finalUser.setPassword(user.password);
        finalUser.isBusiness = false;
        finalUser.businessId = null;
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
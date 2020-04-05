const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('Users');
const axios = require('axios');
const Error = require('./helpers');

router.use(passport.initialize());
router.use(passport.session());

/* istanbul ignore next */
module.exports = {
    addCookie: function(user, req, res) {
        res.cookie('token', user.token, {httpOnly: true});
        res.cookie('test', 'BLUBS');
        req.session.userId = user._id.toString();
    },
    ErrorObject: function(code, message) {
        return {
            error: {
                code: code,
                message: message
            }
        }
    },
    getOneByEmail: function(email)
    {
        Users.findOne({email: email}, (err, matchingUser) => {
            if (err) {
                return { error: { err } };
            }
            else return { account: matchingUser};
        });
    },
    sendEmail: function(email, name, templateId, params)
    {
        return axios.post('https://api.sendinblue.com/v3/smtp/email', {
            to: [
                {
                    email: email,
                    name: name,
                }
            ],
            templateId: templateId,
            params: params
        }, {
            headers: {
                "api-key": process.env.SENDINBLUE_KEY
            }
        })
    },
    AccountObject: function(user, fields) {
        let response = {account: {}};

        if (user.isBusiness && fields.includes("business"))
        {
            response["business"] = { test: "test"}
        }

        response.account = {
            ...( fields.includes("email")) && { email: user.email },
            ...( fields.includes("name")) && { name: user.name },
            ...( fields.includes("_id")) && { _id: user._id},
            ...( fields.includes("picture_url")) && { picture_url: user.picture_url },
            ...( fields.includes("isBusiness")) && { isBusiness: user.isBusiness }
        };
        return response;
    },
    AuthObject: function(user) {
        let response = { account: {}};
        return response.account = {
            _id: user._id,
            email: user.email,
            name: user.name,
            token: user.token
        }
    }
};


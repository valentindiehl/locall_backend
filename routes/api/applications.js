const router = require('express').Router();
const auth = require('../auth');
const mongoose = require('mongoose');
const Applications = mongoose.model('Applications');
const axios = require('axios');

router.post('/', auth.optional, (req, res) => {
    const {body: {application}} = req;

    if (!application.email) {
        return res.status(422).json({
            errors: {
                email: 'is required',
            },
        });
    }

    Applications.findOne({email: application.email}, (err, matchingApplication) => {
        if (err) {
            console.log(err);
        }
        if (matchingApplication != null) {
            console.log("Duplicate user... doing nothing");
        }
        const finalApplication = new Applications(application);

        const OptToken = finalApplication.generateOptInToken(application.email);

        return finalApplication.save()
            .then(() => {
                console.log(finalApplication);
                axios.post('https://api.sendinblue.com/v3/smtp/email', {
                    to: [
                        {
                            email: application.email,
                            name: application.businessName,
                        }
                    ],
                    templateId: 3,
                    params: {
                        businessName: application.businessName,
                        link: process.env.FRONT_URL + "/verify-application/" + OptToken
                    }
                }, {
                    headers: {
                        "api-key": process.env.SENDINBLUE_KEY
                    }
                }).then((data) => res.json({message: "E-Mail-Verification required. Message sent."})
                ).catch((err) => res.status(500).json({message: "registration failed.", code: err}));
            });
    })
});

router.get('/verifyEmail', auth.optional, (req, res, next) => {
    Applications.findOne({optInToken: req.query.token}, function (err, application) {
        if (err) {
            return res.status(500).json({message: "Internal error. Please try again later."})
        }
        if (!application) return res.status(304).json({message: "Already confirmed. No action required."});

        console.log(application);
        application.isOptedIn = true;
        application.optInToken = "";
        application.save()
            .then(() => {
                axios.post('https://api.sendinblue.com/v3/smtp/email', {
                    to: [
                        {
                            email: "kontakt@locall-map.de",
                            name: "Das LOCALL Gastro-Team",
                        }
                    ],
                    templateId: 4,
                    params: {
                        businessName: application.businessName,
                        email: application.email
                    }
                }, {
                    headers: {
                        "api-key": process.env.SENDINBLUE_KEY
                    }
                }).then((data) => res.json({message: "Verification complete. Message sent."})
                ).catch((err) => res.status(500).json({message: "registration failed.", code: err}));
            })
    });
});

module.exports = router;

const router = require('express').Router();
const auth = require('../auth');
const mongoose = require('mongoose');
const helpers = require('./helpers');
const Businesses = mongoose.model('Businesses');
const Users = mongoose.model('Users');
const Donations = mongoose.model('Donations');


router.get('/', auth.required, (req, res, next) => {
    Businesses.find({}, (err, businesses) => {
        /* istanbul ignore next */
        if (err)
        {
            /* istanbul ignore next */
            res.status(500).json(helpers.ErrorObject(500, "Internal Error."))
        }
        let businessList = {};
        businessList["data"] = [];
        console.debug(businesses);
        businesses.forEach(function (business) {
            businessList["data"].push(business);
        });

        res.status(200).json(businessList);
    })
});

router.get('/:id', auth.required, (req, res, next) => {
    Businesses.findOne({_id: req.params.id}, (err, business) => {
        /* istanbul ignore next */
        if (err) {
            /* istanbul ignore next */
            return res.status(500).json(helpers.ErrorObject(500, "Internal error."));
        }
        if (business != null) {
            return res.json(business);
        }
        return res.status(404).json(helpers.ErrorObject(404, "Could not find business with this ID."));
    });
});

router.get('/:id/donations', auth.required, (req, res, next) => {
    const { payload: {id}} = req;

    Users.findById(id)
        .then((user) => {
            if (!user.isBusiness || user.businessId !== req.params.id) return res.status(401).json(helpers.ErrorObject(401, "Unauthorized"));
            Donations.find( { businessId: user.businessId })
                .then((docs) => {
                   return res.status(200).json({ donations: docs })
                })
                .catch((err) => {
                    return res.status(500).json(helpers.ErrorObject(500, "Internal Error"));
                });
        })
});

module.exports = router;

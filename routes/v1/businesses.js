const router = require('express').Router();
const auth = require('../auth');
const mongoose = require('mongoose');
const helpers = require('./helpers');
const Businesses = mongoose.model('Businesses');
const Users = mongoose.model('Users');

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
            console.log(err);
            /* istanbul ignore next */
            return res.status(500).json(helpers.ErrorObject(500, "Internal error."));
        }
        if (business != null) {
            return res.json(business);
        }
        return res.status(404).json(helpers.ErrorObject(404, "Could not find business with this ID."));
    });
});


module.exports = router;

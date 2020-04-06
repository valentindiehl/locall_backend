const router = require('express').Router();
const auth = require('../auth');
const mongoose = require('mongoose');
const Businesses = mongoose.model('Businesses');
const Users = mongoose.model('Users');

router.get('/', auth.required, (req, res, next) => {
    Businesses.find({}, (err, businesses) => {
        if (err)
        {
            res.status(500).json({ 'message': "Internal error. Try again later."})
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

module.exports = router;

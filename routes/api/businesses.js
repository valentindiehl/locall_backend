const router = require('express').Router();
const auth = require('../auth');
const mongoose = require('mongoose');
const Businesses = mongoose.model('Businesses');

router.post('/', auth.optional, (req, res, next) => {
   const { body: { business } } = req;
   console.log(req.body);

   const finalBusiness = new Businesses(business);

   return finalBusiness.save()
       .then(() => res.json({ business: finalBusiness.toJSON() }));
});

router.get('/', auth.optional, (req, res, next) => {
    Businesses.find({}, (err, businesses) => {
        if (err)
        {
            res.status(500).json({ 'message': "Internal error. Try again later."})
        }
        let businessList = {};
        businessList["data"] = [];
        console.log(businesses);
        businesses.forEach(function(business) {
            businessList["data"].push(business);
        });

        res.status(200).json(businessList);
        console.log(res);
    })
});

router.get('/:id', auth.optional, (req, res, next) => {
    Businesses.findOne({id: req.params.id}, (err, business) => {
        if (err)
        {
            console.log(err);
            return res.status(500).json({ 'error': 'Internal server error. Please try again later.'});
        }
        if (business != null)
        {
            return res.json(business);
        }
        return res.status(404).json({ 'error': 'Could not find business with this ID.'});
    });
});

module.exports = router;
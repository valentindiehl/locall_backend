const router = require('express').Router();
const auth = require('../auth');
const mongoose = require('mongoose');
const Businesses = mongoose.model('Businesses');
const Users = mongoose.model('Users');

router.post('/', auth.required, (req, res, next) => {
    const {body: {business}} = req;

    const finalBusiness = new Businesses(business);
    return finalBusiness.save()
        .then(() => res.json({business: finalBusiness.toJSON()}));
});

router.get('/', auth.required, (req, res, next) => {
    Businesses.find({}, (err, businesses) => {
        if (err)
        {
            res.status(500).json({ 'message': "Internal error. Try again later."})
        }
        let businessList = {};
        businessList["data"] = [];
        console.log(businesses);
        businesses.forEach(function (business) {
            businessList["data"].push(business);
        });

        res.status(200).json(businessList);
    })
});

router.put('/', auth.required, (req, res, next) => {
   const {payload: {id}} = req;
   const {body: {business}} = req;

   Users.findById(id)
       .then((user) => {
           if (!user) return res.status(400).json({message: 'Bad request.'});
           if (!user.isBusiness) return res.status(401).json({message: 'Not authorized for business API.'});

           Businesses.findOne({id: user.businessId}, function(err, matchingBusiness) {
               if (err) return res.status(500).json({message: "Internal error. Please try again later."});
               if (!matchingBusiness)
               {
                   return res.status(500).json({message: "Could not find your business. Please consult technical support"});
               }
               if (business.paypal) matchingBusiness.paypal = business.paypal;
               if (business.description) matchingBusiness.message = business.description;

               matchingBusiness.save()
                   .then(() => res.status(200).json({message: "Success: Changes saved."}));
           });
    })
});

router.get('/:id', auth.required, (req, res, next) => {
    Businesses.findOne({id: req.params.id}, (err, business) => {
        if (err) {
            console.log(err);
            return res.status(500).json({'error': 'Internal server error. Please try again later.'});
        }
        if (business != null) {
            return res.json(business);
        }
        return res.status(404).json({'error': 'Could not find business with this ID.'});
    });
});

router.get('/me', auth.required, (req, res, next) => {
   const {payload: {id}} = req;

   Users.findById(id)
       .then((user) => {
          if (!user) return res.status(400).json({message: 'Bad request.'});
          if (!user.isBusiness) return res.status(401).json({message: 'Not authorized for business API.'});

           Businesses.findOne({id: user.businessId}, function(err, business) {
              if (err) return res.status(500).message("Internal error. Please try again later.");
              if (!business)
              {
                  return res.status(500).message("Could not find your business. Please consult technical support");
              }
              return res.status(200).json(business);
           });
       });
   return res.status(400).message("Bad request.");
});

module.exports = router;
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
        let businessList = {};
        businessList["data"] = [];
        console.log(businesses);
        businesses.forEach(function(business) {
            businessList["data"].push(business);
        });

        res.json(businessList);
    })
});

router.get('/:id', auth.optional, (req, res, next) => {
    Businesses.findOne({id: req.params.id}, (err, business) => {
        if (err)
        {
            console.log(err);
            return res.status(404);
        }
        return res.json(business);
    });
})

router.get('/geojson', auth.optional, (req, res, next) => {
    Businesses.find({}, (err, businesses) => {
        let geojson = {
            "type": "geojson",
            "data": {
                "type": "FeatureCollection",
                "features": []
            }
        }
        businesses.forEach(function(business) {
           geojson["data"]["features"].push({
                "type": "Feature",
               "geometry": {
                    "type": "Point",
                   "coordinates": [
                       business.coordinates.lat,
                       business.coordinates.lon
                   ],

               },
               "properties": {
                    "title": business.name,
                   "id": business.id,
                   "icon": business.type
               }
           });
        });
        res.send(geojson);
    })
});

module.exports = router;
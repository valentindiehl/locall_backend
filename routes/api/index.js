const express = require('express');
const router = express.Router();

const auth = require('../auth');
const mongoose = require('mongoose');
const Businesses = mongoose.model('Businesses');

router.use('/users', require('./users'));
router.use('/businesses', require('./businesses'));

router.get('/geojson', auth.optional, (req, res, next) => {
    Businesses.find({}, (err, businesses) => {
        let geojson = {
            type: "geojson",
            data: {
                type: "FeatureCollection",
                features: []
            }
        };
        businesses.forEach(function(business) {
            console.log(business);
            geojson["data"]["features"].push({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [
                        business.coordinates.lat,
                        business.coordinates.lon
                    ],

                },
                properties: {
                    title: business.name,
                    id: business.name,
                    icon: business.type
                }
            });
        });
        res.send(geojson);
    })
});

module.exports = router;
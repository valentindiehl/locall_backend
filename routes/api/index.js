const express = require('express');
const router = express.Router();
const BusinessScheme = require('../../models/Businesses');
let MongoClient = require('mongodb').MongoClient;

const mapdata = require('../../data/mapdata');
const businessdata = require('../../data/businessdata');

router.use('/users', require('./users'));

router.get('/mapdata', (req, res, next) => {
    res.send(mapdata);
});

router.get('/businessdata', (req, res, next) => {
    res.send(businessdata);
})

module.exports = router;
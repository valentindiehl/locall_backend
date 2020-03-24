const express = require('express');
const router = express.Router();

const mapdata = require('../../data/mapdata');
const businessdata = require('../../data/businessdata');

router.use('/users', require('./users'));
router.use('/businesses', require('./businesses'));

router.get('/mapdata', (req, res, next) => {
    res.send(mapdata);
});

router.get('/businessdata', (req, res, next) => {
    res.send(businessdata);
});

module.exports = router;
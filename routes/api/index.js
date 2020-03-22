const express = require('express');
const router = express.Router();

const mapdata = require('../../data/businesses');

router.use('/users', require('./users'));

router.get('/mapdata', (req, res, next) => {
    res.send(mapdata);
});

module.exports = router;
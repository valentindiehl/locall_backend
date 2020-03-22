const express = require('express');
const router = express.Router();

let mapdata = require('../data/businesses');

router.get('/backend/home', function(req, res) {
    res.send('Welcome!');
});
router.get('/backend/secret', function(req, res) {
    res.send('The password is potato');
});

router.get('/backend/getmapdata', function(req, res) {
    res.send(mapdata);
});

router.use('/api', require('./api'));
module.exports = router;

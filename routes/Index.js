const express = require('express');
const router = express.Router();

let mapdata = require('../data/businesses');

router.use('/api', require('./api'));


module.exports = router;

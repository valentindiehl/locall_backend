const express = require('express');
const router = express.Router();

router.use('/api', require('./api'));
router.use('/v1', require('./v1'));


module.exports = router;

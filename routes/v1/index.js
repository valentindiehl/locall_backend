const express = require('express');
const router = express.Router();

router.use('/account', require('./account'));
router.use('/businesses', require('./businesses'));

module.exports = router;
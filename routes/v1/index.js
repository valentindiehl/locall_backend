const express = require('express');
const router = express.Router();

router.use('/account', require('./account'));
router.use('/businesses', require('./businesses'));
router.use('/users', require('./users'));
router.use('/auth', require('./auth'));
router.use('/donations', require('./donations'));
router.use('/events', require('./events'));

module.exports = router;
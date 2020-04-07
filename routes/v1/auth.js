const router = require('express').Router();
const auth = require('../auth');
const helpers = require('./helpers');
const mongoose = require('mongoose');
const passport = require('passport');
const Users = mongoose.model('Users');

router.use(passport.initialize());
router.use(passport.session());

/**
 * Check Authentication
 */
router.get('/', auth.required, (req, res) => {
    return res.status(200).send();
});

/**
 * Log Out
 */
router.delete('/', auth.required, (req, res) => {
    res.clearCookie('token');
    req.session.userId = null;
    return res.status(204).json();
});

module.exports = router;
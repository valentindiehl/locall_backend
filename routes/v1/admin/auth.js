const mongoose = require('mongoose');
const passport = require('passport');
const express = require('express');
const router = require('express').Router();
const Users = mongoose.model('Users');
const axios = require('axios');
const auth = require('../../auth');

router.use(passport.initialize());
router.use(passport.session());

router.post('/login', auth.optional, (req, res) => {
    console.log("Blubs");
});

module.exports = router;

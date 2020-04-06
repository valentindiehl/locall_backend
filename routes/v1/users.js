const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('Users');

router.use(passport.initialize());
router.use(passport.session());

router.get('/:id', auth.required, (req, res, next) => {
    console.debug(req.params.id);
    Users.findById(req.params.id)
        .then(function (matchingUser) {
            if (!matchingUser) return res.status(404).json({message: "User not found."});
            return res.status(200).json({user: {name: matchingUser.name}});
        })
        .catch(function (err) {
            return res.status(500).json({message: "Could not find user."});
        })
});
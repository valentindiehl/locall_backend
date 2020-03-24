const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('Users');

router.post('/', auth.optional, (req, res, next) => {
    const { body: { user } } = req;
    console.log(req);
    console.log(req.body);

    if(!user.email) {
        return res.status(422).json({
            errors: {
                email: 'is required',
            },
        });
    }

    if(!user.password) {
        return res.status(422).json({
            errors: {
                password: 'is required',
            },
        });
    }

    const finalUser = new Users(user);

    finalUser.setPassword(user.password);

    return finalUser.save()
        .then(() => res.json({ user: finalUser.toAuthJSON() }));
});

router.post('/login', auth.optional, (req, res, next) => {
    const { body: { user } } = req;

    console.log(req.body);

    if(!user.email) {
        return res.status(422).json({
            errors: {
                email: 'is required',
            },
        });
    }

    if(!user.password) {
        return res.status(422).json({
            errors: {
                password: 'is required',
            },
        });
    }

    return passport.authenticate('local', { session: false }, (err, passportUser, info) => {
        if(err) {
            console.log(err);
            return next(err);
        }

        if(passportUser) {
            const user = passportUser;
            user.token = passportUser.generateJWT();
            res.cookie('token', user.token, { httpOnly: true });
            return res.json({ user: user.toAuthJSON() });
        }

        return res.status(400).json({
            error: {
                message: 'Bad request'
            }
        });
    })(req, res, next);
});

router.get('/current', auth.required, (req, res, next) => {
    const { payload: { id } } = req;

    return Users.findById(id)
        .then((user) => {
            if(!user) {
                return res.sendStatus(400);
            }

            return res.json({ user: user.toAuthJSON() });
        });
});

router.get('/check', auth.required, (req, res, next) => {
    console.log("Check successful");
   res.sendStatus(200);
});

module.exports = router;
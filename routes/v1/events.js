const router = require('express').Router();
const auth = require('../auth');
const mongoose = require('mongoose');
const helpers = require('./helpers');
const Events = mongoose.model('Events');
const Businesses = mongoose.model('Businesses');

router.post('/', auth.optional, (req, res) => {
    const {body: {event}} = req;

    if (!event.startingTime) return res.status(422).json(helpers.ErrorObject(422, "Start time is missing."));
    if (!event.endTime) return res.status(422).json(helpers.ErrorObject(422, "End time is missing."));
    if (!event.businessId)  return res.status(422).json(helpers.ErrorObject(422, "Hosting business is missing."));
    if (!event.artistName)  return res.status(422).json(helpers.ErrorObject(422, "Artist name is missing."));
    if (!event.businessPaypal || !event.artistPaypal)  return res.status(422).json(helpers.ErrorObject(422, "paypal accounts are missing."));

    Businesses.findById(event.businessId)
        .then((data) => {
            if (!data) return res.status(404).json(helpers.ErrorObject(404, "No matching business found."));
            event.businessName = data.name;

            const finalEvent = new Events(event);

            finalEvent.save()
                .then((data) => {
                    return res.status(200).json(finalEvent);
                });
        })
        .catch((err) => {
            console.log(err);
            return res.status(500).json(helpers.ErrorObject(500, "Internal error."));
        });
});

router.get('/', auth.optional, (req, res) => {
    Events.find({endTime: { $gte: Date.now()}}, (err, events) => {
        return res.status(200).json(events);
    });
});

module.exports = router;

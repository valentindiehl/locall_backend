const router = require('express').Router();
const auth = require('../auth');
const mongoose = require('mongoose');
const helpers = require('./helpers');
const Donations = mongoose.model('Donations');


router.post('/', auth.required, (req, res) => {
   const { body: { donation }} = req;
   const { payload: { id }} = req;

   const finalDonation = new Donations({
       userId: id,
       businessId: donation.businessId,
       amount: donation.amount,
       status: "PENDING"
   });

   finalDonation.save()
       .then(() =>  {
           console.log(finalDonation);
           res.status(200).json({ transactionId: finalDonation._id})
       });
});

router.put('/:id', auth.required, (req, res) => {
    const { body: { donation }} = req;

    Donations.findById(req.params.id)
        .then((matchingDonation) => {
            console.log("FOUND IT");
            matchingDonation.status = donation.status;
            if (donation.paypalId) matchingDonation.paypalId = donation.paypalId;
            if (donation.timestamp) matchingDonation.paypalTimestamp = donation.timestamp;
            if (donation.amount) matchingDonation.amount = donation.amount;

            matchingDonation.save()
                .then(() => {
                    res.status(204).send();
                })
        });
});

module.exports = router;

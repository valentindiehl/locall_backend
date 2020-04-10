const mongoose = require('mongoose');

const { Schema } = mongoose;

const DonationsSchema = new Schema({
    userId: String,
    businessId: String,
    amount: String,
    paypalId: String,
    referenceId: String,
    status: String,
    paypalTimestamp: String,
}, {timestamps: true});

mongoose.model('Donations', DonationsSchema);
 
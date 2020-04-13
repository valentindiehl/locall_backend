const mongoose = require('mongoose');

const { Schema } = mongoose;

const EventsSchema = new Schema({
    businessId: String,
    artistName: String,
    businessName: String,
    businessPaypal: String,
    artistPaypal: String,
    startingTime: Date,
}, {timestamps: true});

mongoose.model('Events', EventsSchema);

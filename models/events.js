const mongoose = require('mongoose');

const { Schema } = mongoose;

const EventsSchema = new Schema({
    businessId: String,
    artistId: String,
    artistName: String,
    BusinessName: String,
    businessPaypal: String,
    artistPaypal: String,
    startingTime: Date,
}, {timestamps: true});

mongoose.model('Events', EventsSchema);

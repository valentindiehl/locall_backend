const mongoose = require('mongoose');

const { Schema } = mongoose;

const EventsSchema = new Schema({
    businessId: String,
    artistName: String,
    businessName: String,
    businessPaypal: String,
    artistPaypal: String,
    startingTime: Date,
    description: String,
    endTime: Date,
}, {timestamps: true});

mongoose.model('Events', EventsSchema);

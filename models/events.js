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
    summary: String,
    endTime: Date,
    url: String,
    title: String,
}, {timestamps: true});

mongoose.model('Events', EventsSchema);

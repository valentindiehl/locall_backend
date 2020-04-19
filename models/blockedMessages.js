const mongoose = require('mongoose');

const { Schema } = mongoose;

const BlockedMessagesSchema = new Schema({
    userId: String,
    eventId: String,
    message: String,
}, {timestamps: true});

mongoose.model('BlockedMessages', BlockedMessagesSchema);

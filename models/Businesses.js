const mongoose = require('mongoose');

const { Schema } = mongoose;

const BusinessSchema = new Schema({
    name: String,
    type: String,
    description: String,
    address: String,
    coordinates: {
        lat: String,
        lon: String
    },
    image_url: String,
    tables: [
        {
            id: Number,
            name: String,
            capacity: Number,
            current: Number
        }
    ]
});

mongoose.model('Businesses', BusinessSchema);


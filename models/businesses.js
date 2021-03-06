const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);


const { Schema } = mongoose;

const BusinessSchema = new Schema({
    name: String,
    type: String,
    message: String,
    address: String,
    coordinates: {
        lat: String,
        lon: String
    },
    paypal: String,
    image_url: String,
    business_url: String,
    tables: [
        {
            id: Number,
            name: String,
            capacity: Number,
            current: Number
        }
    ]
});

BusinessSchema.plugin(AutoIncrement, {inc_field: 'id'});
mongoose.model('Businesses', BusinessSchema);

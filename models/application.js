const mongoose = require('mongoose');
const crypto = require('crypto');

const { Schema } = mongoose;

const ApplicationsSchema = new Schema({
    businessName: String,
    email: String,
    isOptedIn: Boolean,
    optInToken: String
});

ApplicationsSchema.methods.generateOptInToken = function(email) {
    const seed = crypto.randomBytes(20);
    this.isOptedIn = false;
    this.optInToken = crypto.createHash('sha1').update(seed + email).digest('hex');
    console.log(this.optInToken);
    return this.optInToken;
};

mongoose.model('Applications', ApplicationsSchema);

const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { Schema } = mongoose;

const UsersSchema = new Schema({
    email: String,
    name: String,
    city: String,
    optInToken: String,
    isOptedIn: Boolean,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    hash: String,
    salt: String,
});

UsersSchema.methods.setPassword = function(password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

UsersSchema.methods.validatePassword = function(password) {
    const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
    return this.hash === hash;
};

UsersSchema.methods.generateOptInToken = function(email) {
    const seed = crypto.randomBytes(20);
    this.isOptedIn = false;
    this.optInToken = crypto.createHash('sha1').update(seed + email).digest('hex');
    console.log(this.optInToken);
    return this.optInToken;
};

UsersSchema.methods.generatePasswordResetToken = function() {
    const seed = crypto.randomBytes(20);
    this.resetPasswordToken = crypto.createHash('sha1').update(seed).digest('hex');
    this.resetPasswordExpires = Date.now() + 86400000;

    return this.resetPasswordToken;
}

UsersSchema.methods.generateJWT = function() {
    const today = new Date();
    const expirationDate = new Date(today);
    expirationDate.setDate(today.getDate() + 60);

    return jwt.sign({
        email: this.email,
        id: this._id,
        exp: parseInt(expirationDate.getTime() / 1000, 10),
    }, 'secret');
}

UsersSchema.methods.toAuthJSON = function() {
    return {
        _id: this._id,
        email: this.email,
        token: this.generateJWT(),
    };
};
mongoose.model('Users', UsersSchema);

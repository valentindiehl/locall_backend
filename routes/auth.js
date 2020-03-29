const jwt = require('express-jwt');

const getTokenFromCookie = (req) => {
    return req.cookies.token;
};

const getTokenFromHeaders = (req) => {
    const { headers: { authorization } } = req;

    if(authorization && authorization.split(' ')[0] === 'Token') {
        return authorization.split(' ')[1];
    }
    return null;
};

const auth = {
    required: jwt({
        secret: 'secret',
        userProperty: 'payload',
        getToken: getTokenFromCookie,
    }),
    optional: jwt({
        secret: 'secret',
        userProperty: 'payload',
        getToken: getTokenFromCookie,
        credentialsRequired: false,
    }),
};

module.exports = auth;

const jwt = require('express-jwt');

/* istanbul ignore next */
const getTokenFromCookie = (req) => {
    return req.cookies.token;
};

/* istanbul ignore next */
const getTokenFromHeaders = (req) => {
    const { headers: { authorization } } = req;

    if(authorization && authorization.split(' ')[0] === 'Token') {
        return authorization.split(' ')[1];
    }
    return null;
};

/* istanbul ignore next */
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

const request = require('supertest');
const app = require('../app');

const mongoose = require('mongoose');
const Users = mongoose.model('Users');


describe("Email Validation Flow", () => {
    it('should validate an existing account', async () => {
        let token = "";
        await Users.findOne({email: "test@test.de"}, function (err, user) {
            token = user.optInToken;
        });
        console.log(token);
        const res = await request(app)
            .post('/v1/account/email-validation')
            .send({
                account: {
                    token: token
                }
            });
        expect(res.statusCode).toEqual(200);
    });
});
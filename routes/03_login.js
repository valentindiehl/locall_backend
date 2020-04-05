const request = require('supertest');
const app = require('../app');

const mongoose = require('mongoose');
const Users = mongoose.model('Users');

describe("Login Flow", () => {
    it('should allow login for an existing account', async () => {
        const res = await request(app)
            .post('/v1/account/login')
            .send({
                account: {
                    email: "test@test.de",
                    password: "test12345"
                }
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('account');
    });
    it('should throw no error for a non-existing account', async () => {
        const res = await request(app)
            .post('/v1/account/login')
            .send({
                account: {
                    email: "non-existing@test.de",
                    password: "test12345"
                }
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('error');
    });
    it('should allow a user to update his password', async () => {
        let res = await request(app)
            .post('/v1/account/login')
            .send({
                account: {
                    email: "non-existing@test.de",
                    password: "test12345"
                }
            });
        console.log(res.cookies);
        let cookie = res.cookies.token;

        res = await request(app)
            .patch('/v1/account/password')
            .send({
                account: {
                    oldPassword: "test12345",
                    password: "test12345"
                }
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('account');
    });
});
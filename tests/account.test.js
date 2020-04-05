const request = require('supertest');
const app = require('../app');

const mongoose = require('mongoose');
const Users = mongoose.model('Users');

describe('Registration & Login Flow', () => {
    afterAll(() => {
        mongoose.disconnect();
    });

    beforeAll(() => {
        Users.deleteOne({email: "hello@valentindiehl.de"})
            .then(() => {
                console.log("Cleared database");
            });
    });

    describe("Registration Flow", () => {
        it('should create a new user', async () => {
            const res = await request(app)
                .post('/v1/account')
                .send({
                    account: {
                        email: "hello@valentindiehl.de",
                        name: "Test User",
                        password: "test12345"
                    }
                });
            expect(res.statusCode).toEqual(202);
            expect(res.body).toHaveProperty('account');
        });
        it('should return an error if fields are missing', async () => {
            const res = await request(app)
                .post('/v1/account')
                .send({
                    account: {
                        email: "hello@valentindiehl.de",
                    }
                });
            expect(res.statusCode).toEqual(422);
            expect(res.body).toHaveProperty('error');
        });
        it('should return no error for a duplicate registration', async () => {
            const res = await request(app)
                .post('/v1/account')
                .send({
                    account: {
                        email: "hello@valentindiehl.de",
                        password: "test12345"
                    }
                });
            expect(res.statusCode).toEqual(202);
            expect(res.body).toHaveProperty('account');
        });
        it('should return an error for a login without validation', async () => {
            const res = await request(app)
                .post('/v1/account/login')
                .send({
                    account: {
                        email: "hello@valentindiehl.de",
                        password: "test12345"
                    }
                });
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('error');
        });
        it('should return an error for a login with missing fields', async () => {
            const res = await request(app)
                .post('/v1/account/login')
                .send({
                    account: {
                        email: "hello@valentindiehl.de",
                    }
                });
            expect(res.statusCode).toEqual(422);
            expect(res.body).toHaveProperty('error');
        });

        it('should validate an existing account', async () => {
            let token = "";
            await Users.findOne({email: "hello@valentindiehl.de"}, function (err, user) {
                console.log("Searching for User token...");
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

    describe("Login Flow", () => {
        it('should allow login for an existing account', async () => {
            const res = await request(app)
                .post('/v1/account/login')
                .send({
                    account: {
                        email: "hello@valentindiehl.de",
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
            expect(res.body.error.code).toEqual(101);
        });
        it('should allow a user to update his password', async () => {
            let res = await request(app)
                .post('/v1/account/login')
                .send({
                    account: {
                        email: "hello@valentindiehl.de",
                        password: "test12345"
                    }
                });
            console.log(res.headers['set-cookies']);
            let cookie = res.headers['set-cookie'];

            res = await request(app)
                .patch('/v1/account/password')
                .set('cookie', cookie)
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
});


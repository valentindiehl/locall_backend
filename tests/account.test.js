const request = require('supertest');
const app = require('../app');

const mongoose = require('mongoose');
const Users = mongoose.model('Users');


describe('Registration & Login Flow', () => {

    beforeAll(async () => {
        await Users.deleteOne({email: "testaccount@locall-map.de"})
    });

    it('should create a new user', async () => {
        const res = await request(app)
            .post('/v1/account')
            .send({
                account: {
                    email: "testaccount@locall-map.de",
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
                    email: "testaccount@locall-map.de",
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
                    email: "testaccount@locall-map.de",
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
                    email: "testaccount@locall-map.de",
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
                    email: "testaccount@locall-map.de",
                }
            });
        expect(res.statusCode).toEqual(422);
        expect(res.body).toHaveProperty('error');
    });

    it('should validate an existing account', async () => {
        let token = "";
        await Users.findOne({email: "testaccount@locall-map.de"})
            .then((user) => {
                console.log("Searching for User token...");
                console.log(user);
                token = user.optInToken;
                console.log(token);
                const res = request(app)
                    .post('/v1/account/email-validation')
                    .send({
                        account: {
                            token: token
                        }
                    })
                    .then((res) => {
                        expect(res.statusCode).toEqual(200);
                    })
            });
    });
});

describe('Login Flow', () => {

     beforeAll((done) => {
        const user = {
            email: "testaccount2@locall-map.de",
            name: "Name to test"
        }
        const finalUser = new Users(user);
        finalUser.setPassword("test12345");
        finalUser.isOptedIn = true;
        return finalUser.save()
            .then((user) => {
                done();
            });
    });

    it('should allow login for an existing account', async () => {
        const res = await request(app)
            .post('/v1/account/login')
            .send({
                account: {
                    email: "testaccount2@locall-map.de",
                    password: "test12345"
                }
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('account');
    });
    it('should not allow login for an account with wrong password', async () => {
        const res = await request(app)
            .post('/v1/account/login')
            .send({
                account: {
                    email: "testaccount2@locall-map.de",
                    password: "test123456"
                }
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('error');
    });
    it('should throw no error for a non-existing account', async () => {
        const res = await request(app)
            .post('/v1/account/login')
            .send({
                account: {
                    email: "test2@locall-map.de",
                    password: "test12345"
                }
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('error');
        expect(res.body.error.code).toEqual(101);
    });
});
describe('Password Reset Flow', () => {

    it('should allow a user to update his password', async () => {
        let res = await request(app)
            .post('/v1/account/login')
            .send({
                account: {
                    email: "testaccount2@locall-map.de",
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

    it('should not allow a user to update his password when type fields are missing', async () => {
        let res = await request(app)
            .post('/v1/account/login')
            .send({
                account: {
                    email: "testaccount2@locall-map.de",
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
                    password: "test12345"
                }
            });
        expect(res.statusCode).toEqual(400);
    });

    it('should not allow a user to update his password when other fields are missing', async () => {
        let res = await request(app)
            .post('/v1/account/login')
            .send({
                account: {
                    email: "testaccount2@locall-map.de",
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
                    oldPassword: "test12345"
                }
            });
        expect(res.statusCode).toEqual(422);
    });

    it('should not allow a user to update his password when his old password is wrong', async () => {
        let res = await request(app)
            .post('/v1/account/login')
            .send({
                account: {
                    email: "testaccount2@locall-map.de",
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
                    oldPassword: "test123456",
                    password: "test12345"
                }
            });
        expect(res.statusCode).toEqual(401);
    });

    it('should not allow an unauthenticated user to update his password', async () => {
        res = await request(app)
            .patch('/v1/account/password')
            .send({
                account: {
                    oldPassword: "test12345",
                    password: "test12345"
                }
            });
        expect(res.statusCode).toEqual(401);
    });

    it('should send a password reset request', async () => {
        res = await request(app)
            .patch('/v1/account/password')
            .send({
                account: {
                    email: "testaccount@locall-map.de"
                }
            });
        expect(res.statusCode).toEqual(200);
    });

    it('should reset a password with a valid token', async () => {
       await request(app)
            .patch('/v1/account/password')
            .send({
                account: {
                    email: "testaccount@locall-map.de"
                }
            })
           .then((res) => {
            Users.findOne({email: "testaccount@locall-map.de"}).exec()
                .then((user) => {
                    request(app)
                        .patch('/v1/account/password')
                        .send({
                            account: {
                                resetToken: user.resetPasswordToken,
                                password: "test12345"
                            }
                        })
                        .then((res) => {
                            expect(res.statusCode).toEqual(200);
                            expect(res.body.message).toContain("updated");
                        })
                        .catch((err) => {
                            console.log(err);
                        })
                })
            })
           .catch((err) => {
               console.log(err);
           })
    });

    it('should not reset a password with an invalid token', async () => {
       const res = await request(app)
           .patch('/v1/account/password')
           .send({
               account: {
                   resetToken: "invalid",
                   password: "test12345"
               }
           })
        expect(res.statusCode).toEqual(404);
    });
});



describe("Account Modification Flow", () => {

    it('should allow an authenticated user to update his name', async() => {
        let res = await request(app)
            .post('/v1/account/login')
            .send({
                account: {
                    email: "testaccount@locall-map.de",
                    password: "test12345"
                }
            });
        console.log(res.headers['set-cookies']);
        let cookie = res.headers['set-cookie'];
        console.log(cookie);

        res = await request(app)
            .patch('/v1/account/name')
            .set('cookie', cookie)
            .send({
                account: {
                    name: "Test User"
                }
            });
        expect(res.statusCode).toEqual(200);
    });

    it('should not allow an unauthenticated user to update his name', async() => {
        res = await request(app)
            .patch('/v1/account/name')
            .send({
                account: {
                    name: "Test User"
                }
            });
        expect(res.statusCode).toEqual(401);
    });

});

describe('User Deletion Flow', () => {

    afterAll(() => {
        mongoose.disconnect();
    });

    it('should delete an authenticated user', async() => {
        let res = await request(app)
            .post('/v1/account/login')
            .send({
                account: {
                    email: "testaccount@locall-map.de",
                    password: "test12345"
                }
            });
        console.log(res.headers['set-cookies']);
        let cookie = res.headers['set-cookie'];
        console.log(cookie);

        res = await request(app)
            .delete('/v1/account')
            .set('cookie', cookie)
            .send();
        expect(res.statusCode).toEqual(200);
    });

    it('should clean up database connection', () => {
        expect(1).toEqual(1);
    })
});

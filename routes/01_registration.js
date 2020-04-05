const request = require('supertest');
const app = require('../app');

const mongoose = require('mongoose');
const Users = mongoose.model('Users');

describe("Registration Flow", () => {
    it('should create a new user', () => {
        const res = request(app)
            .post('/v1/account')
            .send({
                account: {
                    email: "test@test.de",
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
                    email: "test@test.de",
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
                    email: "test@test.de",
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
                    email: "test@test.de",
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
                    email: "test@test.de",
                }
            });
        expect(res.statusCode).toEqual(422);
        expect(res.body).toHaveProperty('error');
    });
});
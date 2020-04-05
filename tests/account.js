const request = require('supertest');
const app = require('../app');

const mongoose = require('mongoose');
const Users = mongoose.model('Users');

describe("Registration Flow", () => {
    /*
    it('should create a new user', async (done) => {
        const res = await request(app)
            .post('/v1/account')
            .send({
                account: {
                    email: "test@test.de",
                    password: "test12345"
                }
            })
        expect(res.statusCode).toEqual(202);
        expect(res.body).toHaveProperty('account');
        done();
    });
/*    it('should return an error if fields are missing', function(done) {
        const res = request(app)
            .post('/v1/account')
            .send({
                account: {
                    email: "test@test.de",
                }
            });
        expect(res.statusCode).toEqual(422);
        expect(res.body).toHaveProperty('error');
        done();
    });
    it('should return no error for a duplicate registration', function(done) {
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
        done();
    });
    it('should return an error for a login without validation', function(done) {
        const res = request(app)
            .post('/v1/account/login')
            .send({
                account: {
                    email: "test@test.de",
                    password: "test12345"
                }
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('error');
        done();
    });
    it('should return an error for a login with missing fields', function(done) {
        const res = request(app)
            .post('/v1/account/login')
            .send({
                account: {
                    email: "test@test.de",
                }
            });
        expect(res.statusCode).toEqual(422);
        expect(res.body).toHaveProperty('error');
        done();
    }); */
});
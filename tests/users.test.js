const request = require('supertest');
const app = require('../app');
const {Mongo} = require('mongodb');

const mongoose = require('mongoose');
const Users = mongoose.model('Users');

describe('Public Users API Endpoint', () => {

    beforeAll(async () => {
        const testUser = await new Users({
            email: "test",
            name: "test",
            _id: "8e86f61d1c9d440000118e29"
        });
        const authUser = await new Users({
            email: "userstest@nonexisting.de",
            name: "Test Auth User",
            isOptedIn: true
        });
        await authUser.setPassword("test12345");
        await authUser.save();
        await testUser.save();
    });

    afterAll(async () => {
        await Users.deleteOne({ _id: "8e86f61d1c9d440000118e29"});
        await Users.deleteOne({email: "userstest@nonexisting.de"});
        await mongoose.disconnect();
    });

    it('should not give an unauthenticated user public information', async() => {
        const res = await request(app)
            .get('/v1/users/8e86f61d1c9d440000118e29')
            .send();
        expect(res.statusCode).toEqual(401);
    });

    it('should give an authenticated user public information', async () => {
        let res = await request(app)
            .post('/v1/account/login')
            .send({
                account: {
                    email: "userstest@nonexisting.de",
                    password: "test12345"
                }
            });
        console.log(res.headers['set-cookies']);
        let cookie = res.headers['set-cookie'];
        console.log(cookie);

        res = await request(app)
            .get('/v1/users/8e86f61d1c9d440000118e29')
            .set('cookie', cookie)
            .send();
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('user');
    });

    it('should throw an error on non-existing information', async () => {
        let res = await request(app)
            .post('/v1/account/login')
            .send({
                account: {
                    email: "userstest@nonexisting.de",
                    password: "test12345"
                }
            });
        console.log(res.headers['set-cookies']);
        let cookie = res.headers['set-cookie'];
        console.log(cookie);

        res = await request(app)
            .get('/v1/users/7e86f61d1c9d440000118e29')
            .set('cookie', cookie)
            .send();
        expect(res.statusCode).toEqual(404);
        expect(res.body).toHaveProperty('error');
    });
});
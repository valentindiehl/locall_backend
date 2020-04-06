const request = require('supertest');
const app = require('../app');

const mongoose = require('mongoose');
const Users = mongoose.model('Users');
const Businesses = mongoose.model('Businesses');

describe('Auth Check & Logout', () => {

    beforeAll(async () => {
        const businessUser = await new Users({
            email: "authTest@nonexisting.de",
            name: "Ultra Auth Haxxor",
            isOptedIn: true,
        });
        await businessUser.setPassword("test12345");
        await businessUser.save();
    });

    afterAll(async () => {
        await Users.deleteOne({email: "authTest@nonexisting.de"});
        await mongoose.disconnect();
    });

    it('should not allow check when checking an un-authenticated user', async() => {
        res = await request(app)
            .get('/v1/auth')
            .send();
        expect(res.statusCode).toEqual(401);
    });

    it('should allow check when checking an authenticated user', async () => {
        let res = await request(app)
            .post('/v1/account/login')
            .send({
                account: {
                    email: "authTest@nonexisting.de",
                    password: "test12345"
                }
            });
        console.log(res.headers['set-cookies']);
        let cookie = res.headers['set-cookie'];
        console.log(cookie);

        res = await request(app)
            .get('/v1/auth')
            .set('cookie', cookie)
            .send();
        expect(res.statusCode).toEqual(200 || 304);
    });

    it('should not allow logout on an un-authenticated user', async () => {
        res = await request(app)
            .delete('/v1/auth')
            .send();
        expect(res.statusCode).toEqual(401);
    });

    it('should allow logout on an authenticated user', async () => {
        let res = await request(app)
            .post('/v1/account/login')
            .send({
                account: {
                    email: "authTest@nonexisting.de",
                    password: "test12345"
                }
            });
        console.log(res.headers['set-cookies']);
        let cookie = res.headers['set-cookie'];
        console.log(cookie);

        res = await request(app)
            .delete('/v1/auth')
            .set('cookie', cookie)
            .send();
        expect(res.statusCode).toEqual(204);
        expect(res.headers.token).toEqual(undefined);
    });

});
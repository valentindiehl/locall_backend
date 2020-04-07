const request = require('supertest');
const app = require('../app');

const mongoose = require('mongoose');
const Users = mongoose.model('Users');
const Businesses = mongoose.model('Businesses');

describe('Account List Generation', () => {

    afterAll(async () => {
        await Users.deleteOne({email: "businssestest@nonexisting.de"});
        await Businesses.deleteOne({_id: "9e86f61d1c9d440000118e29"})
        await mongoose.disconnect();
    });

    beforeAll(async () => {
        const testBusiness = await new Businesses({
            coordinates: { lat: '11.575538', lon: '48.137292' },
            _id: "9e86f61d1c9d440000118e29",
            id: 999,
            name: 'TestItem',
            type: 'cafe',
            message: 'Willkommen in unserem HQ!',
            address: 'Im Zentrum der Welt',
            paypal: 'officialjonas',
            image_url: 'https://locall-map.de/assets/icons/logo-locall.svg',
            tables: null
        });

        const authUser = await new Users({
            email: "businssestest@nonexisting.de",
            name: "Test Auth User",
            isOptedIn: true
        });

        await authUser.setPassword("test12345");
        await authUser.save();
        await testBusiness.save();
    });

    it('should not return the businesses if not authenticated', async () => {
        const res = await request(app)
            .get('/v1/businesses')
            .send();
        expect(res.statusCode).toEqual(401);
    });

    it('should return a list of businesses from the database if authenticated', async () => {
        let res = await request(app)
            .post('/v1/account/login')
            .send({
                account: {
                    email: "businssestest@nonexisting.de",
                    password: "test12345"
                }
            });
        console.log(res.headers['set-cookies']);
        let cookie = res.headers['set-cookie'];
        console.log(cookie);

        res = await request(app)
            .get('/v1/businesses')
            .set('cookie', cookie)
            .send();
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('data');
    });

    it('should not return a particular business if not authenticated', async () => {
        const res = await request(app)
            .get('/v1/businesses/9e86f61d1c9d440000118e29')
            .send();
        expect(res.statusCode).toEqual(401);
    });

    it('should return a particular businesses from the database if authenticated', async () => {
        let res = await request(app)
            .post('/v1/account/login')
            .send({
                account: {
                    email: "businssestest@nonexisting.de",
                    password: "test12345"
                }
            });
        console.log(res.headers['set-cookies']);
        let cookie = res.headers['set-cookie'];
        console.log(cookie);

        res = await request(app)
            .get('/v1/businesses/9e86f61d1c9d440000118e29')
            .set('cookie', cookie)
            .send();
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('name');
    });

    it('should not return a non-existing business', async () => {
        let res = await request(app)
            .post('/v1/account/login')
            .send({
                account: {
                    email: "businssestest@nonexisting.de",
                    password: "test12345"
                }
            });
        console.log(res.headers['set-cookies']);
        let cookie = res.headers['set-cookie'];
        console.log(cookie);

        res = await request(app)
            .get('/v1/businesses/9e86f6191c9d440de0118e29')
            .set('cookie', cookie)
            .send();
        expect(res.statusCode).toEqual(404);
        expect(res.body).toHaveProperty('error');
    });
});
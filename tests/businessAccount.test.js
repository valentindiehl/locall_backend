const request = require('supertest');
const app = require('../app');

const mongoose = require('mongoose');
const Users = mongoose.model('Users');
const Businesses = mongoose.model('Businesses');

describe("Account Business Info", () => {

    beforeAll(async () => {
        const testBusiness = await new Businesses({
            coordinates: { lat: '11.575538', lon: '48.137292' },
            _id: "1e86f61d1c9d880000118e29",
            id: 999,
            name: 'TestItem',
            type: 'cafe',
            message: 'Willkommen in unserem HQ!',
            address: 'Im Zentrum der Welt',
            paypal: 'officialjonas',
            image_url: 'https://locall-map.de/assets/icons/logo-locall.svg',
            tables: null
        });
        await testBusiness.save();
        const businessUser = await new Users({
            email: "businessUser@nonexisting.de",
            name: "Ultra Business Owner",
            isOptedIn: true,
            isBusiness: true,
            businessId: "1e86f61d1c9d880000118e29"
        });
        businessUser.setPassword("test12345");
        await businessUser.save();
    });

    afterAll(async () => {
        await Businesses.deleteOne({_id: "1e86f61d1c9d880000118e29"});
        await Users.deleteOne({email: "businessUser@nonexisting.de"});
        await mongoose.disconnect();
    });

    it('should let an authenticated business user account access its business information', async() => {
        let res = await request(app)
            .post('/v1/account/login')
            .send({
                account: {
                    email: "businessUser@nonexisting.de",
                    password: "test12345"
                }
            });
        console.log(res.headers['set-cookies']);
        let cookie = res.headers['set-cookie'];
        console.log(cookie);

        res = await request(app)
            .get('/v1/account/business')
            .set('cookie', cookie)
            .send();
        expect(res.statusCode).toEqual(200);
        console.log(res.body);
        expect(res.body).toHaveProperty('name');
    });

    it('shoud allow an authenticated user to make changes on their data', async() => {
        let res = await request(app)
            .post('/v1/account/login')
            .send({
                account: {
                    email: "businessUser@nonexisting.de",
                    password: "test12345"
                }
            });
        console.log(res.headers['set-cookies']);
        let cookie = res.headers['set-cookie'];
        console.log(cookie);

        res = await request(app)
            .patch('/v1/account/business')
            .set('cookie', cookie)
            .send({
                business: {
                    description: "Test",
                    paypal: "blubs"
                }
            });
        console.log(res.body);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('paypal');
    });

});
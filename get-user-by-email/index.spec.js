'use strict';

const expect = require('chai').expect;
const helpers = require('../spec/helpers');
const request = require('request-promise');
const uuid = require('uuid');
const crypto = require('crypto');
const randomString = crypto.randomBytes(3).toString('hex');
const email = `test.${randomString}@vourity.com`;
const sampleUser = { ...require('../spec/sample-docs/Users'), _id: uuid.v4(), email };
const { getMongodbCollection } = require('../db/mongodb');
sampleUser.email = email;
sampleUser.mobilePhone = '+123123';

describe('Get user by email', () => {
    before(async () => {
        sampleUser.partitionKey = sampleUser._id;
        const collection = await getMongodbCollection('Users');
        await collection.insertOne(sampleUser);
    });

    it('should not return user if the user of this email do not exist', async () => {
        const users = await request
            .get(`${helpers.API_URL}/api/v1/users/xyz@domain.com/user`, {
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });

        expect(users).not.to.be.null;
        expect(users).to.be.instanceOf(Array).and.have.lengthOf(0);
    });

    it('should return the document when all validation passes', async () => {
        const user = await request
            .get(`${helpers.API_URL}/api/v1/users/${sampleUser.email}/user`, {
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });

        expect(user).not.to.be.null;
        expect(user[0].email).to.equal(sampleUser.email);
    });

    it('should return the document of specified number when all validation passes', async () => {
        const user = await request
            .get(`${helpers.API_URL}/api/v1/users/${sampleUser.mobilePhone}/user`, {
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });

        expect(user).not.to.be.null;
        expect(user[0].mobilePhone).to.equal(sampleUser.mobilePhone);
    });

    it('should return the document when case insensitive emailId sent all validation passes', async () => {
        const user = await request
            .get(`${helpers.API_URL}/api/v1/users/${sampleUser.email.toUpperCase()}/user`, {
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });

        expect(user).not.to.be.null;
        expect(user[0].email).to.equal(sampleUser.email);
    });

    after(async () => {
        const collection = await getMongodbCollection('Users');
        await collection.deleteOne({ _id: sampleUser._id, docType: 'users', partitionKey: sampleUser._id });

    });
});
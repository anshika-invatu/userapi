'use strict';

const expect = require('chai').expect;
const helpers = require('../spec/helpers');
const request = require('request-promise');
const uuid = require('uuid');
const crypto = require('crypto');
const randomString = crypto.randomBytes(3).toString('hex');
const email = `test.${randomString}@vourity.com`;
const email2 = `test.${randomString}@vourity.com`;
const email3 = `test.${randomString}@vourity.com`;
const email4 = `test.${randomString}@vourity.com`;
const email5 = `test.${randomString}@vourity.com`;
const email6 = `test.${randomString}@vourity.com`;

const sampleUser = { ...require('../spec/sample-docs/Users'), _id: uuid.v4() };
const sampleUser2 = { ...require('../spec/sample-docs/Users'), _id: uuid.v4() };
const sampleUser3 = { ...require('../spec/sample-docs/Users'), _id: uuid.v4() };
const sampleUser4 = { ...require('../spec/sample-docs/Users'), _id: uuid.v4() };
const sampleUser5 = { ...require('../spec/sample-docs/Users'), _id: uuid.v4() };
const sampleUser6 = { ...require('../spec/sample-docs/Users'), _id: uuid.v4() };
sampleUser.email = email;
sampleUser2.email = email2;
sampleUser3.email = email3;
sampleUser4.email = email4;
sampleUser5.email = email5;
sampleUser6.email = email6;

const { getMongodbCollection } = require('../db/mongodb');
const sampleMerchantID = uuid.v4();

describe('Set User Role', () => {
    before(async () => {
        //only 2 users linked with sampleMerchantID
        sampleUser.merchants = new Array({ merchantID: sampleMerchantID });
        sampleUser2.merchants = new Array({ merchantID: sampleMerchantID });
        sampleUser.partitionKey = sampleUser._id;
        sampleUser2.partitionKey = sampleUser2._id;
        sampleUser3.partitionKey = sampleUser3._id;
        sampleUser4.partitionKey = sampleUser4._id;
        sampleUser5.partitionKey = sampleUser5._id;
        sampleUser6.partitionKey = sampleUser6._id;
        const collection = await getMongodbCollection('Users');
        await collection.insertOne(sampleUser);
        await collection.insertOne(sampleUser2);
        await collection.insertOne(sampleUser3);
        await collection.insertOne(sampleUser4);
        await collection.insertOne(sampleUser5);
        await collection.insertOne(sampleUser6);
    });

    it('should throw 404 error if no user exist of specified merchantID', async () => {
        try {
            await request.post(`${helpers.API_URL}/api/v1/set-user-role`, {
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                },
                body: {
                    userID: uuid.v4(),
                    merchantID: uuid.v4(),
                    role: 'sales'
                }
            });
        } catch (error) {
            const response = {
                code: 404,
                description: 'No users exist of this userID',
                reasonPhrase: 'UserNotFoundError'
            };

            expect(error.statusCode).to.equal(404);
            expect(error.error).to.eql(response);
        }
    });


    it('should update role when all validation passes', async () => {
        const result = await request
            .post(`${helpers.API_URL}/api/v1/set-user-role`, {
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                },
                body: {
                    userID: sampleUser2._id,
                    merchantID: sampleMerchantID,
                    role: 'sales'
                }
            });

        expect(result).not.to.be.null;
        expect(result.description).to.eql('Successfully updated the role');

        const collection = await getMongodbCollection('Users');
        const user = await collection.findOne({ _id: sampleUser2._id, docType: 'users', partitionKey: sampleUser2._id });
        expect(user.merchants[0].roles).to.eql('sales');
    });

    after(async () => {
        const collection = await getMongodbCollection('Users');
        await collection.deleteOne({ _id: sampleUser._id, docType: 'users', partitionKey: sampleUser._id });
        await collection.deleteOne({ _id: sampleUser2._id, docType: 'users', partitionKey: sampleUser2._id });
        await collection.deleteOne({ _id: sampleUser3._id, docType: 'users', partitionKey: sampleUser3._id });
        await collection.deleteOne({ _id: sampleUser4._id, docType: 'users', partitionKey: sampleUser4._id });
        await collection.deleteOne({ _id: sampleUser5._id, docType: 'users', partitionKey: sampleUser5._id });
        await collection.deleteOne({ _id: sampleUser6._id, docType: 'users', partitionKey: sampleUser6._id });

    });
});
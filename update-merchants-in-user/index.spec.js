'use strict';

const expect = require('chai').expect;
const helpers = require('../spec/helpers');
const request = require('request-promise');
const uuid = require('uuid');
const sampleUser = { ...require('../spec/sample-docs/Users'), _id: uuid.v4() };
const { getMongodbCollection } = require('../db/mongodb');
const crypto = require('crypto');
const randomString = crypto.randomBytes(3).toString('hex');
const email = `test.${randomString}@vourity.com`;
sampleUser.email = email;
const merchantID = uuid.v4();
const merchantID1 = uuid.v4();
const merchantID2 = uuid.v4();
sampleUser.merchants = [
    {
        merchantID: merchantID1,
        merchantName: 'Turistbutiken i Åre',
        userGroups: '',
        roles: '',
        businessUnitID: uuid.v4()
    },
    {
        merchantID: merchantID2,
        merchantName: 'Turistbutiken i Malmö',
        userGroups: '',
        roles: '',
        businessUnitID: uuid.v4()
    }
];


describe('Update merchant in user doc', () => {
    before(async () => {
        sampleUser.partitionKey = sampleUser._id;
        const collection = await getMongodbCollection('Users');
        await collection.insertOne(sampleUser);
    });

    it('should throw error on incorrect _id field', async () => {
        try {
            await request.post(`${helpers.API_URL}/api/v1/merchants/123/users/123`, {
                json: true,
                body: {},
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            const response = {
                code: 400,
                description: 'The user id specified in the URL does not match the UUID v4 format.',
                reasonPhrase: 'InvalidUUIDError'
            };

            expect(error.statusCode).to.equal(400);
            expect(error.error).to.eql(response);
        }
    });

    it('should update document when all validation passes', async () => {
        const result = await request.post(`${helpers.API_URL}/api/v1/merchants/${merchantID}/users/${sampleUser._id}`, {
            body: {
                merchantID: merchantID,
                merchantName: 'Turistbutiken i Åre',
                userGroups: '',
                roles: '',
                businessUnitID: uuid.v4()
            },
            json: true,
            headers: {
                'x-functions-key': process.env.X_FUNCTIONS_KEY
            }
        });
        expect(result).to.eql({ code: 200, description: 'Successfully updated the document' });
    });

    it('should update document when all validation passes', async () => {
        const result = await request.delete(`${helpers.API_URL}/api/v1/merchants/${merchantID2}/users/${sampleUser._id}`, {
            json: true,
            headers: {
                'x-functions-key': process.env.X_FUNCTIONS_KEY
            }
        });
        expect(result).to.eql({ code: 200, description: 'Successfully updated the document' });
    });


    after(async () => {
        const collection = await getMongodbCollection('Users');
        await collection.deleteOne({ _id: sampleUser._id, docType: 'users', partitionKey: sampleUser._id });
        
    });
});
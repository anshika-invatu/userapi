'use strict';

const expect = require('chai').expect;
const helpers = require('../spec/helpers');
const request = require('request-promise');
const crypto = require('crypto');
const randomString = crypto.randomBytes(3).toString('hex');
const email = `test.${randomString}@vourity.com`;
const { getMongodbCollection } = require('../db/mongodb');
const uuid = require('uuid');
const sampleUser = { ...require('../spec/sample-docs/Users'), _id: uuid.v4() };
sampleUser.email = email;
sampleUser.partitionKey = sampleUser._id;
sampleUser.mobilePhone += randomString;

describe('request-verification-code', () => {
    before(async () => {
        await request.post(helpers.API_URL + '/api/v1/users', {
            body: sampleUser,
            json: true,
            headers: {
                'x-functions-key': process.env.X_FUNCTIONS_KEY
            }
        });
    });

    it('should return status code 400 when request body is null', async () => {
        try {
            await request.post(helpers.API_URL + '/api/v1/request-verification-code', {
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            const response = {
                code: 400,
                description: 'You\'ve requested to create a validation code but the request body seems to be empty. Kindly pass the userID and event for creating a validation code',
                reasonPhrase: 'EmptyRequestBodyError'
            };
            expect(error.statusCode).to.equal(400);
            expect(error.error).to.eql(response);
        }
    });

    it('should throw error on incorrect _id field', async () => {
        try {
            await request.post(helpers.API_URL + '/api/v1/request-verification-code', {
                body: {
                    _id: 123
                },
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            const response = {
                code: 400,
                description: 'The _id field specified in the request body does not match the UUID v4 format.',
                reasonPhrase: 'InvalidUUIDError'
            };
            expect(error.statusCode).to.equal(400);
            expect(error.error).to.eql(response);
        }
    });

    it('it should save document', async () => {
        const result = await request.post(helpers.API_URL + '/api/v1/request-verification-code', {
            json: true,
            body: {
                '_id': sampleUser._id,
                'action': 'delete'
            },
            headers: {
                'x-functions-key': process.env.X_FUNCTIONS_KEY
            }
        });
        expect(result).not.to.be.null;
        expect(result.docType).to.equal('verificationCode');
        expect(result.userID).to.equal(sampleUser._id);
        expect(result.partitionKey).to.equal(sampleUser._id);
    });

    after(async () => {
        const collection = await getMongodbCollection('Users');
        await collection.deleteOne({ _id: sampleUser._id, docType: 'users', partitionKey: sampleUser._id });
        await collection.deleteOne({ docType: 'verificationCode', partitionKey: sampleUser._id });
    });
});
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

describe('Update user', () => {
    before(async () => {
        sampleUser.partitionKey = sampleUser._id;
        const collection = await getMongodbCollection('Users');
        await collection.insertOne(sampleUser);
    });

    it('should return status code 400 when request body is null', async () => {
        try {
            await request.patch(`${helpers.API_URL}/api/v1/users/${sampleUser._id}`, {
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            const response = {
                code: 400,
                description: 'You\'ve requested to update a user but the request body seems to be empty. Kindly specify the user properties to be updated using request body in application/json format',
                reasonPhrase: 'EmptyRequestBodyError'
            };

            expect(error.statusCode).to.equal(400);
            expect(error.error).to.eql(response);
        }
    });

    it('should throw error on incorrect _id field', async () => {
        try {
            await request.patch(`${helpers.API_URL}/api/v1/users/123`, {
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

    it('should throw error if the request body does not contain any fields', async () => {
        try {
            await request.patch(`${helpers.API_URL}/api/v1/users/${sampleUser._id}`, {
                body: {},
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            const response = {
                code: 400,
                description: 'You\'ve requested to update a user but the request body seems to be empty. Kindly specify the user properties to be updated using request body in application/json format',
                reasonPhrase: 'EmptyRequestBodyError'
            };

            expect(error.statusCode).to.equal(400);
            expect(error.error).to.eql(response);
        }
    });

    it('should throw 404 error if the documentId is invalid', async () => {
        try {
            await request.patch(`${helpers.API_URL}/api/v1/users/${uuid.v4()}`, {
                body: { isRedeemed: true },
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            const response = {
                code: 404,
                description: 'The user id specified in the URL doesn\'t exist.',
                reasonPhrase: 'UserNotFoundError'
            };

            expect(error.statusCode).to.equal(404);
            expect(error.error).to.eql(response);
        }
    });

    it('should update document when all validation passes', async () => {
        const result = await request.patch(`${helpers.API_URL}/api/v1/users/${sampleUser._id}`, {
            body: { isRedeemed: true },
            json: true,
            headers: {
                'x-functions-key': process.env.X_FUNCTIONS_KEY
            }
        });
        expect(result).to.eql({ code: 200, description: 'Successfully updated the document' });

        // Get sample document
        const user = await request
            .get(`${helpers.API_URL}/api/v1/users/${sampleUser._id}`, {
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        expect(user).not.to.be.null;
        expect(user.isRedeemed).to.equal(true);
        expect(user.createdDate).not.to.be.null;
        expect(user.updatedDate).not.to.be.null;
        expect(user.updatedDate).not.to.equal(sampleUser.updatedDate);
    });

    after(async () => {
        const collection = await getMongodbCollection('Users');
        await collection.deleteOne({ _id: sampleUser._id, docType: 'users', partitionKey: sampleUser._id });
        
    });
});
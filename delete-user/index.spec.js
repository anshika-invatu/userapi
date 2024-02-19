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

describe('Delete user', () => {
    before(async () => {
        sampleUser.partitionKey = sampleUser._id;
        const collection = await getMongodbCollection('Users');
        await collection.insertOne(sampleUser);
    });

    it('should throw error on incorrect id field', async () => {
        try {
            await request.delete(`${helpers.API_URL}/api/v1/users/123-abc`, {
                json: true,
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

    it('should throw 404 error if the documentId is invalid', async () => {
        try {
            await request.delete(`${helpers.API_URL}/api/v1/users/${uuid.v4()}`, {
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

    it('should delete the document when all validation passes', async () => {
        const user = await request
            .delete(`${helpers.API_URL}/api/v1/users/${sampleUser._id}`, {
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });

        expect(user).not.to.be.null;
        expect(user).to.eql({ code: 200, description: 'Successfully deleted the specified user' });

        // Get document
        try {
            await request.get(`${helpers.API_URL}/api/v1/users/${sampleUser._id}`, {
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            expect(error.statusCode).to.equal(404);
        }
    });

});
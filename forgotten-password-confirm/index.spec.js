'use strict';

const expect = require('chai').expect;
const helpers = require('../spec/helpers');
const request = require('request-promise');
const uuid = require('uuid');
const sampleUser = { ...require('../spec/sample-docs/Users'), _id: uuid.v4() };
const passwordResetRequestDoc = { ...require('../spec/sample-docs/PasswordResetRequest'), _id: uuid.v4() };
passwordResetRequestDoc.partitionKey = passwordResetRequestDoc._id;
const crypto = require('crypto');
const randomString = crypto.randomBytes(3).toString('hex');
const email = `test.${randomString}@vourity.com`;
sampleUser.email = email;
const { getMongodbCollection } = require('../db/mongodb');
passwordResetRequestDoc.userID = sampleUser._id;

describe('forgotten-password-confirm', () => {
    before(async () => {
        sampleUser.partitionKey = sampleUser._id;
        const collection = await getMongodbCollection('Users');
        await collection.insertOne(sampleUser);
        await collection.insertOne(passwordResetRequestDoc);
    });

    it('should return status code 400 when request body is null', async () => {
        try {
            await request.post(`${helpers.API_URL}/api/v1/forgotten-password-confirm`, {
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            const response = {
                code: 400,
                description: 'You\'ve requested to reset password but the request body seems to be empty. Kindly pass the new password and resetRequestID in request body in application/json format',
                reasonPhrase: 'EmptyRequestBodyError'
            };
            expect(error.statusCode).to.equal(400);
            expect(error.error).to.eql(response);
        }
    });

    it('should return error when Doc is not present in database', async () => {
        try {
            await request.post(`${helpers.API_URL}/api/v1/forgotten-password-confirm`, {
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                },
                body: {
                    resetRequestID: uuid.v4(),
                    newPassword: 'newTest@123'
                }
            });
        } catch (error) {
            const response = {
                code: 404,
                description: 'Request failed',
                reasonPhrase: 'PasswordResetRequestError'
            };
            expect(error.statusCode).to.equal(404);
            expect(error.error).to.eql(response);
        }
    });

    it('should return status code 400 when request body is not have resetRequestID and newPassword fields', async () => {
        try {
            await request.post(`${helpers.API_URL}/api/v1/forgotten-password-confirm`, {
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                },
                body: {}
            });
        } catch (error) {
            const response = {
                code: 400,
                description: 'Please provide resetRequestID and newPassword fields in the request body',
                reasonPhrase: 'FieldValidationError'
            };
            expect(error.statusCode).to.equal(400);
            expect(error.error).to.eql(response);
        }
    });

    it('should return status code 200 when forgot password request received successfully', async () => {
        const result = await request.post(`${helpers.API_URL}/api/v1/forgotten-password-confirm`, {
            json: true,
            body: {
                resetRequestID: passwordResetRequestDoc._id,
                newPassword: 'newTest@123'
            },
            headers: {
                'x-functions-key': process.env.X_FUNCTIONS_KEY
            }
        });
        expect(result).to.eql({ code: 200, description: 'Password reset successfully' });

        const user = await request.post(helpers.API_URL + '/api/v1/login', {
            body: {
                email: sampleUser.email,
                password: 'newTest@123'
            },
            json: true,
            headers: {
                'x-functions-key': process.env.X_FUNCTIONS_KEY
            }
        });
        expect(user).not.to.be.null;
        expect(user.token).not.to.be.null;
    });
    after(async () => {
        const collection = await getMongodbCollection('Users');
        await collection.deleteOne({ _id: sampleUser._id, docType: 'users', partitionKey: sampleUser._id });
    });
});
'use strict';

const expect = require('chai').expect;
const helpers = require('../spec/helpers');
const request = require('request-promise');
const uuid = require('uuid');
const crypto = require('crypto');
const randomString = crypto.randomBytes(3).toString('hex');
const email = `test.${randomString}@vourity.com`;
const sampleUser = { ...require('../spec/sample-docs/Users'), _id: uuid.v4() };
const collectionName = 'Users';
const bcrypt = require('bcryptjs');
const { getMongodbCollection } = require('../db/mongodb');

describe('Change Password', () => {

    before(async () => {
        var salt = bcrypt.genSaltSync(12);
        var hash = bcrypt.hashSync(sampleUser.password, salt);
        sampleUser.password = hash;
        sampleUser.partitionKey = sampleUser._id;
        sampleUser.email = email;
        const collection = await getMongodbCollection(collectionName);
        await collection.insertOne(sampleUser);
    });

    it('should throw error on incorrect _id field', async () => {
        try {
            await request.post(`${helpers.API_URL}/api/v1/changepass/123`, {
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

            console.log(response);
        }
    });

    it('should return status code 400 when request body is null', async () => {
        try {
            await request.post(`${helpers.API_URL}/api/v1/changepass/${sampleUser._id}`, {
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            const response = {
                code: 400,
                description: 'You\'ve requested to change password but the request body seems to be empty.',
                reasonPhrase: 'EmptyRequestBodyError'
            };

            expect(error.statusCode).to.equal(400);
            expect(error.error).to.eql(response);
        }
    });

    it('should return status code 200 when password changed successfully', async () => {

        const existingUser = { ...require('../spec/sample-docs/Users') };
        const result = await request.post(`${helpers.API_URL}/api/v1/changepass/${sampleUser._id}`, {
            json: true,
            body: {
                'oldPassword': existingUser.password,
                'newPassword': 'test123456'
            },
            headers: {
                'x-functions-key': process.env.X_FUNCTIONS_KEY
            }
        });
        expect(result).to.eql({ code: 200, description: 'Password Changed Successfully' });
    });

    after(async () => {
        const collection = await getMongodbCollection(collectionName);
        await collection.deleteOne({ _id: sampleUser._id, docType: 'users', partitionKey: sampleUser._id });
    });
});
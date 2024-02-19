'use strict';

const expect = require('chai').expect;
const helpers = require('../spec/helpers');
const request = require('request-promise');
const uuid = require('uuid');
const sampleUser = { ...require('../spec/sample-docs/Users'), _id: uuid.v4() };
const Promise = require('bluebird');
const bcrypt = require('bcryptjs');
const { getMongodbCollection } = require('../db/mongodb');
const crypto = require('crypto');
const randomString = crypto.randomBytes(3).toString('hex');
const email = `test.${randomString}@vourity.com`;
sampleUser.email = email;

describe('Login user', () => {
    before(async () => {
        try {
            var salt = bcrypt.genSaltSync(12);
            var hash = bcrypt.hashSync(sampleUser.password, salt);
            sampleUser.password = hash;
            sampleUser.partitionKey = sampleUser._id;
            const collection = await getMongodbCollection('Users');
            await collection.insertOne(sampleUser);

        } catch (error) {
            return Promise.reject(error);
        }
    });


    it('should return status code 400 when request body is null', async () => {
        try {
            await request.post(helpers.API_URL + '/api/v1/login', {
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            const response = {
                code: 400,
                description: 'You have requested to authenticate a user but the request body seems to be empty. Kindly pass the user to be authenticated using request body in application/json format',
                reasonPhrase: 'EmptyRequestBodyError'
            };

            expect(error.statusCode).to.equal(400);
            expect(error.error).to.eql(response);
        }
    });

    it('should throw unable to authenticate user error, If password is wrong.', async () => {
        try {
            await request.post(helpers.API_URL + '/api/v1/login', {
                body: {
                    email: sampleUser.email,
                    password: 'randomincorrectpassword'
                },
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            const response = {
                code: 401,
                description: 'Unable to authenticate user.',
                reasonPhrase: 'UserNotAuthenticatedError'
            };

            expect(error.statusCode).to.equal(401);
            expect(error.error).to.eql(response);
        }
    });

    after(async () => {
        const collection = await getMongodbCollection('Users');
        await collection.deleteOne({ _id: sampleUser._id, docType: 'users', partitionKey: sampleUser._id });
        
    });
});
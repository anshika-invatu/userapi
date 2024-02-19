'use strict';

const expect = require('chai').expect;
const helpers = require('../spec/helpers');
const request = require('request-promise');
const uuid = require('uuid');
const crypto = require('crypto');
const randomString = crypto.randomBytes(3).toString('hex');
const email = `test.${randomString}@vourity.com`;
const { getMongodbCollection } = require('../db/mongodb');
let result;

describe('Signup', () => {

    before(async () => {
        result = await request.post(helpers.API_URL + '/api/v1/signup', {
            json: true,
            body: {
                'fullName': 'Test Name',
                'email': email,
                'iAgreeToTCandPrivacy': true,
                'iAmOlderThan18': true,
                'iAgreeToAgreement': true,
                'country': 'SE'
            },
            headers: {
                'x-functions-key': process.env.X_FUNCTIONS_KEY
            }
        });
    });
    it('should throw error on incorrect id field', async () => {
        try {
            await request.get(`${helpers.API_URL}/api/v1/usersignup/123-abc`, {
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

    it('should throw user not found error on non exist userid field', async () => {
        try {
            await request.get(`${helpers.API_URL}/api/v1/usersignup/${uuid.v4()}`, {
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


    it('it should return signup document on request successfull.', async () => {
        const response = await request.get(helpers.API_URL + `/api/v1/usersignup/${result._id}`, {
            json: true,
            headers: {
                'x-functions-key': process.env.X_FUNCTIONS_KEY
            }
        });
       
        expect(response).not.to.be.null;
        expect(response._id).to.equal(result._id);
    });


    after(async () => {
        await getMongodbCollection('Users')
            .then(collection => {
                collection.deleteOne({
                    _id: result._id,
                    docType: 'userSignup',
                    partitionKey: result._id
                });
            });
    });



});
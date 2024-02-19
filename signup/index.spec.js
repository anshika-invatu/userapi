'use strict';

const expect = require('chai').expect;
const helpers = require('../spec/helpers');
const request = require('request-promise');
const crypto = require('crypto');
const randomString = crypto.randomBytes(3).toString('hex');
const email = `test.${randomString}@vourity.com`;
const { getMongodbCollection } = require('../db/mongodb');

describe('Signup', () => {

    it('should return status code 400 when request body is null', async () => {
        try {
            await request.post(helpers.API_URL + '/api/v1/signup', {
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            const response = {
                code: 400,
                description: 'You have requested for signup but the request body seems to be empty.',
                reasonPhrase: 'EmptyRequestBodyError'
            };

            expect(error.statusCode).to.equal(400);
            expect(error.error).to.eql(response);
        }
    });

    it('should return status code 400 when email is invalid', async () => {
        try {
            await request.post(helpers.API_URL + '/api/v1/signup', {
                json: true,
                body: {
                    'email': 'randomwrongemail.com'
                },
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            const response = {
                code: 400,
                description: 'Please provide valid email address',
                reasonPhrase: 'FieldValidationError'
            };

            expect(error.statusCode).to.equal(400);
            expect(error.error).to.eql(response);
        }
    });

   

    it('it should return document if signup request successfully processed.', async () => {
        const result = await request.post(helpers.API_URL + '/api/v1/signup', {
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
        await getMongodbCollection('Users')
            .then(collection => {
                collection.deleteOne({
                    _id: result._id,
                    partitionKey: result._id,
                    docType: 'userSignup'
                });
            });
        expect(result).not.to.be.null;
        expect(result.docType).to.equal('userSignup');
    });


});
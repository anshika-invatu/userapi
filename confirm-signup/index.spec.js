'use strict';

const expect = require('chai').expect;
const helpers = require('../spec/helpers');
const request = require('request-promise');
const crypto = require('crypto');
const randomString = crypto.randomBytes(3).toString('hex');
const email = `test.${randomString}@vourity.com`;
const { getMongodbCollection } = require('../db/mongodb');
const uuid = require('uuid');
const sampleCountries = { ...require('../spec/sample-docs/Countries'), _id: uuid.v4() };
const samplePrice = { ...require('../spec/sample-docs/PricePlan'), _id: uuid.v4() };
let signupResult;

describe('Confirm Signup', () => {

    before(async () => {
        const collection = await getMongodbCollection('Merchants');
        sampleCountries.partitionKey = sampleCountries._id;
        await collection.insertOne(sampleCountries);
        samplePrice.country = 'SE';
        samplePrice.partitionKey = samplePrice._id;
        await collection.insertOne(samplePrice);
        signupResult = await request.post(helpers.API_URL + '/api/v1/signup', {
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

    it('should return error with status code 404 when SignUpUser_id not found', async () => {
        try {
            const url = helpers.API_URL + '/api/v1/confirmsignup';
            await request.post(url, {
                json: true,
                body: {
                    _id: uuid.v4(),
                    password: 'test12345'
                },
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            const response = {
                code: 404,
                description: 'The _id specified in the body doesn\'t exist.',
                reasonPhrase: 'UserNotFoundError'
            };
            expect(error.statusCode).to.equal(404);
            expect(error.error).to.eql(response);
        }
    });

    it('should return error with status code 400 when request body is null', async () => {
        try {
            await request.post(helpers.API_URL + '/api/v1/confirmsignup', {
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            const response = {
                code: 400,
                description: 'You have requested for signup confirmation but the request body seems to be empty.',
                reasonPhrase: 'EmptyRequestBodyError'
            };

            expect(error.statusCode).to.equal(400);
            expect(error.error).to.eql(response);
        }
    });

    it('should throw error with status code 400 on invalid password', async () => {
        try {
            await request.post(`${helpers.API_URL}/api/v1/confirmsignup`, {
                json: true,
                body: {
                    password: 'test'
                },
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            const response = {
                code: 400,
                description: 'Password length must be minimum 8 characters or maximum 50 characters long.',
                reasonPhrase: 'FieldValidationError'
            };
            expect(error.statusCode).to.equal(400);
            expect(error.error).to.eql(response);
        }
    });

    it('it should return success with status code 200 if signup confirmation completed successfully', async () => {

        const result = await request.post(helpers.API_URL + '/api/v1/confirmsignup', {
            json: true,
            body: {
                _id: signupResult._id,
                password: 'test12345'
            },
            headers: {
                'x-functions-key': process.env.X_FUNCTIONS_KEY
            }
        });
        expect(result).not.to.be.null;
        expect(result).to.eql({ code: 200, description: 'Signup confirmation completed successfully.' });
        const result1 = await request.get(`${helpers.API_URL}/api/v1/users/${signupResult.email}/user`, {
            json: true,
            headers: {
                'x-functions-key': process.env.X_FUNCTIONS_KEY
            }
        });
        var collection = await getMongodbCollection('Merchants');
        const webshop = await collection.findOne({ ownerMerchantID: result1[0].merchants[0].merchantID, docType: 'webshop' });
        expect(webshop.products[0]).not.to.be.null;
        expect(webshop.products[1]).not.to.be.null;
        expect(webshop.products[2]).not.to.be.null;
        const merchantPricePlan = await collection.findOne({ merchantID: result1[0].merchants[0].merchantID, docType: 'merchantPricePlan' });
        expect(merchantPricePlan).not.to.be.null;
    });

    after(async () => {
        const result = await request.get(`${helpers.API_URL}/api/v1/users/${signupResult.email}/user`, {
            json: true,
            headers: {
                'x-functions-key': process.env.X_FUNCTIONS_KEY
            }
        });

        const balanceAccounts = await request.get(`${process.env.VOUCHER_API_URL}/api/v1/merchants/${result[0].merchants[0].merchantID}/balance-accounts`, {
            json: true,
            headers: {
                'x-functions-key': process.env.VOUCHER_API_KEY
            }
        });
        var allRequest = [];
        balanceAccounts.forEach(balanceAccount => {
            allRequest.push(request.delete(`${process.env.VOUCHER_API_URL}/api/v1/balance-accounts/${balanceAccount._id}?merchantID=${result[0].merchants[0].merchantID}`, {
                json: true,
                headers: {
                    'x-functions-key': process.env.VOUCHER_API_KEY
                }
            }));
        });
        await Promise.all(allRequest);
        var collection = await getMongodbCollection('Merchants');
        await collection.deleteOne({ _id: sampleCountries._id, docType: 'countries', partitionKey: sampleCountries._id });
        await collection.deleteOne({ _id: samplePrice._id, docType: 'pricePlan', partitionKey: samplePrice._id });
        const webshop = await collection.findOne({ ownerMerchantID: result[0].merchants[0].merchantID, docType: 'webshop' });
        await collection.deleteOne({ _id: webshop.products[0].productID, docType: 'products', partitionKey: webshop.products[0].productID });
        await collection.deleteOne({ _id: webshop.products[1].productID, docType: 'products', partitionKey: webshop.products[1].productID });
        await collection.deleteOne({ _id: webshop.products[2].productID, docType: 'products', partitionKey: webshop.products[2].productID });
        await collection.deleteOne({ ownerMerchantID: result[0].merchants[0].merchantID, docType: 'webshop', partitionKey: result[0].merchants[0].merchantID });
        await collection.deleteOne({ _id: result[0].merchants[0].merchantID, docType: 'merchants', partitionKey: result[0].merchants[0].merchantID });
        await collection.deleteOne({ merchantID: result[0].merchants[0].merchantID, docType: 'businessUnits', partitionKey: result[0].merchants[0].merchantID });
        await request.delete(`${helpers.API_URL}/api/v1/users/${result[0]._id}`, {
            json: true,
            headers: {
                'x-functions-key': process.env.X_FUNCTIONS_KEY
            }
        });
        await request.delete(`${process.env.LEDGERS_API_URL}/api/v1/merchants/${result[0].merchants[0].merchantID}/account-lists`, {
            json: true,
            headers: {
                'x-functions-key': process.env.LEDGERS_API_KEY
            }
        });
    });
});
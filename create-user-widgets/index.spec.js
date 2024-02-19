'use strict';

const expect = require('chai').expect;
const helpers = require('../spec/helpers');
const request = require('request-promise');
const uuid = require('uuid');
const userID = uuid.v4();
const sampleUserWidgets = { ...require('../spec/sample-docs/UserWidgets'), _id: uuid.v4() };
const { getMongodbCollection } = require('../db/mongodb');
sampleUserWidgets.partitionKey = userID;
sampleUserWidgets.userID = userID;

describe('Create User Widgets', () => {
    it('should return status code 400 when request body is null', async () => {
        try {
            await request.post(helpers.API_URL + '/api/v1/user-widgets', {
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            const response = {
                code: 400,
                description: 'You\'ve requested to create a new user widgets but the request body seems to be empty. Kindly pass the user widgets to be created using request body in application/json format',
                reasonPhrase: 'EmptyRequestBodyError'
            };

            expect(error.statusCode).to.equal(400);
            expect(error.error).to.eql(response);
        }
    });

    it('should throw error on incorrect _id field', async () => {
        try {
            await request.post(helpers.API_URL + '/api/v1/user-widgets', {
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

    it('should create document when all validation passes', async () => {


        const result = await request.post(helpers.API_URL + '/api/v1/user-widgets', {
            body: sampleUserWidgets,
            json: true,
            headers: {
                'x-functions-key': process.env.X_FUNCTIONS_KEY
            }
        });

        expect(result).not.to.be.null;
        expect(result._id).to.equal(sampleUserWidgets._id);
        expect(result.docType).to.equal('userWidgets');
    });

    it('should throw error if the document already exists', async () => {
        try {
            await request.post(helpers.API_URL + '/api/v1/user-widgets', {
                body: sampleUserWidgets,
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
           
        } catch (error) {

            const response = {
                code: 409,
                description: 'You\'ve requested to create a new userWidgets but a userWidgets with the specified _id field already exists.',
                reasonPhrase: 'DuplicateUserWidgetsError'
            };

            expect(error.statusCode).to.equal(409);
            expect(error.error).to.eql(response);

        }

    });


    after(async () => {
        const collection = await getMongodbCollection('Users');
        await collection.deleteOne({ _id: sampleUserWidgets._id, docType: 'userWidgets', partitionKey: userID });

    });
});
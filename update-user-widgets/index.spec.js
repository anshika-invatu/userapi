'use strict';

const expect = require('chai').expect;
const helpers = require('../spec/helpers');
const request = require('request-promise');
const uuid = require('uuid');
const userID = uuid.v4();
const merchantID = uuid.v4();
const sampleUserWidgets = { ...require('../spec/sample-docs/UserWidgets'), _id: uuid.v4() };
const { getMongodbCollection } = require('../db/mongodb');
sampleUserWidgets.partitionKey = userID;
sampleUserWidgets.userID = userID;
sampleUserWidgets.merchantIDs = [merchantID];
sampleUserWidgets.merchants = {
    [merchantID]: {
        pageCodes: {
            posDashboard: {
                layout: {
                }
            },
            posOpenHours: {
                layout: {
                }
            }
        }
    }
};
describe('Update User Widgets', () => {
    before(async () => {
        const collection = await getMongodbCollection('Users');
        await collection.insertOne(sampleUserWidgets);
    });

    it('should return status code 400 when request body is null', async () => {
        try {
            await request.patch(`${helpers.API_URL}/api/v1/merchants/${merchantID}/user-widgets/${userID}`, {
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            const response = {
                code: 400,
                description: 'You\'ve requested to update a new user widgets but the request body seems to be empty. Kindly pass the user widgets to be created using request body in application/json format',
                reasonPhrase: 'EmptyRequestBodyError'
            };

            expect(error.statusCode).to.equal(400);
            expect(error.error).to.eql(response);
        }
    });

    it('should throw error on incorrect userID field', async () => {
        try {
            await request.patch(`${helpers.API_URL}/api/v1/merchants/${merchantID}/user-widgets/123`, {
                json: true,
                body: {},
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            const response = {
                code: 400,
                description: 'The userID field specified in the request does not match the UUID v4 format.',
                reasonPhrase: 'InvalidUUIDError'
            };

            expect(error.statusCode).to.equal(400);
            expect(error.error).to.eql(response);
        }
    });

    it('should throw error on incorrect merchantID field', async () => {
        try {
            await request.patch(`${helpers.API_URL}/api/v1/merchants/${123}/user-widgets/${userID}`, {
                json: true,
                body: {},
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            const response = {
                code: 400,
                description: 'The merchantID field specified in the request does not match the UUID v4 format.',
                reasonPhrase: 'InvalidUUIDError'
            };

            expect(error.statusCode).to.equal(400);
            expect(error.error).to.eql(response);
        }
    });

    it('should update document when all validation passes', async () => {
        const result = await request.patch(`${helpers.API_URL}/api/v1/merchants/${merchantID}/user-widgets/${userID}?pageCode=posDashboard`, {
            body: {
                posDashboard: {
                    'layout': {
                        1: 12345
                    }
                }
            },
            json: true,
            headers: {
                'x-functions-key': process.env.X_FUNCTIONS_KEY
            }
        });
        expect(result).to.eql({ code: 200, description: 'Successfully updated the document' });

    });

    it('should insert document when all not exist', async () => {
        const newUserID = uuid.v4();
        const result = await request.patch(`${helpers.API_URL}/api/v1/merchants/${uuid.v4()}/user-widgets/${newUserID}?pageCode=posDashboard`, {
            body: {
                posDashboard: {
                    'layout': {
                        1: 12345
                    }
                }
            },
            json: true,
            headers: {
                'x-functions-key': process.env.X_FUNCTIONS_KEY
            }
        });
        const collection = await getMongodbCollection('Users');
        await collection.deleteOne({ _id: result._id, docType: 'userWidgets', partitionKey: result.partitionKey });
        expect(result.userID).to.eql(newUserID);
    });

    after(async () => {
        const collection = await getMongodbCollection('Users');
        await collection.deleteOne({ _id: sampleUserWidgets._id, docType: 'userWidgets', partitionKey: userID });
    });
});
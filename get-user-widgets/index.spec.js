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


describe('Get User Widgets', () => {
    before(async () => {
        const collection = await getMongodbCollection('Users');
        await collection.insertOne(sampleUserWidgets);
    });

    it('should throw error on incorrect userId field', async () => {
        try {
            await request.get(`${helpers.API_URL}/api/v1/merchants/${merchantID}/user-widgets/123-abc`, {
                json: true,
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

    it('should throw error on incorrect id field', async () => {
        try {
            await request.get(`${helpers.API_URL}/api/v1/merchants/${123}/user-widgets/${userID}`, {
                json: true,
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

    it('should return epmty array if the documentId is invalid', async () => {
        
        const result = await request.get(`${helpers.API_URL}/api/v1/merchants/${merchantID}/user-widgets/${uuid.v4()}`, {
            json: true,
            headers: {
                'x-functions-key': process.env.X_FUNCTIONS_KEY
            }
        });
        expect(result).not.to.be.null;
        expect(result).to.be.instanceOf(Array);
    });

    it('should return the document when all validation passes', async () => {
        const result = await request
            .get(`${helpers.API_URL}/api/v1/merchants/${merchantID}/user-widgets/${userID}`, {
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });

        expect(result).not.to.be.null;
        expect(result[0]._id).to.equal(sampleUserWidgets._id);
    });

    after(async () => {
        const collection = await getMongodbCollection('Users');
        await collection.deleteOne({ _id: sampleUserWidgets._id, docType: 'userWidgets', partitionKey: userID });
        
    });
});
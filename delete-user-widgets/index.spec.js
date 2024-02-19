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
describe('Delete User Widgets', () => {
    before(async () => {
        const collection = await getMongodbCollection('Users');
        await collection.insertOne(sampleUserWidgets);
    });


    it('should throw 404 error if the documentId is invalid', async () => {
        try {
            await request.delete(`${helpers.API_URL}/api/v1/merchants/${merchantID}/user-widgets/${uuid.v4()}`, {
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            const response = {
                code: 404,
                description: 'The user widgets details specified in the URL doesn\'t exist.',
                reasonPhrase: 'UserWidgetsNotFoundError'
            };

            expect(error.statusCode).to.equal(404);
            expect(error.error).to.eql(response);
        }
    });

    it('should delete document when all validation passes', async () => {
        const result = await request.delete(`${helpers.API_URL}/api/v1/merchants/${merchantID}/user-widgets/${userID}?pageCode=posDashboard`, {
            json: true,
            headers: {
                'x-functions-key': process.env.X_FUNCTIONS_KEY
            }
        });
        expect(result).to.eql({ code: 200, description: 'Successfully deleted the document' });

    });

    
});
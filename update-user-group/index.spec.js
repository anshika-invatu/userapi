'use strict';

const expect = require('chai').expect;
const helpers = require('../spec/helpers');
const request = require('request-promise');
const uuid = require('uuid');
const sampleUserGroup = { ...require('../spec/sample-docs/UserGroups'), _id: uuid.v4() };
const { getMongodbCollection } = require('../db/mongodb');
sampleUserGroup.partitionKey = sampleUserGroup._id;

describe('update user group', () => {

    before(async () => {
        sampleUserGroup.partitionKey = sampleUserGroup._id;
        const collection = await getMongodbCollection('Users');
        await collection.insertOne(sampleUserGroup);
    });

    it('should throw error on incorrect _id field', async () => {
        try {
            await request.patch(`${helpers.API_URL}/api/v1/merchants/${uuid.v4()}/user-group/123`, {
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            const response = {
                code: 400,
                description: 'The userGroupID field specified in the request body does not match the UUID v4 format.',
                reasonPhrase: 'InvalidUUIDError'
            };

            expect(error.statusCode).to.equal(400);
            expect(error.error).to.eql(response);
        }
    });

    it('should throw error if the document not exists', async () => {

        try {
            await request.patch(`${helpers.API_URL}/api/v1/merchants/${uuid.v4()}/user-group/${uuid.v4()}`, {
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            const response = {
                code: 404,
                description: 'The user group id specified in the URL doesn\'t exist.',
                reasonPhrase: 'UserGroupNotFoundError'
            };

            expect(error.statusCode).to.equal(404);
            expect(error.error).to.eql(response);
        }
    });

    it('should update document when all validation passes', async () => {

        const user = await request.patch(`${helpers.API_URL}/api/v1/merchants/${sampleUserGroup.merchantID}/user-group/${sampleUserGroup._id}`, {
            json: true,
            headers: {
                'x-functions-key': process.env.X_FUNCTIONS_KEY
            }
        });
        expect(user).not.to.be.null;
        expect(user.description).to.equal('Successfully updated the document');


    });


    after(async () => {
        const collection = await getMongodbCollection('Users');
        await collection.deleteOne({ _id: sampleUserGroup._id, docType: 'userGroups', partitionKey: sampleUserGroup._id });
        
    });
});
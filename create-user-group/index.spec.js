'use strict';

const expect = require('chai').expect;
const helpers = require('../spec/helpers');
const request = require('request-promise');
const uuid = require('uuid');
const sampleUserGroup = { ...require('../spec/sample-docs/UserGroups'), _id: uuid.v4() };
const { getMongodbCollection } = require('../db/mongodb');
sampleUserGroup.partitionKey = sampleUserGroup._id;

describe('Create user group', () => {
    it('should return status code 400 when request body is null', async () => {
        try {
            const url = `${helpers.API_URL}/api/v1/merchants/${uuid.v4()}/user-group`;
            await request.post(url, {
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            const response = {
                code: 400,
                description: 'You\'ve requested to create a new user-group but the request body seems to be empty. Kindly pass the user-group to be created using request body in application/json format',
                reasonPhrase: 'EmptyRequestBodyError'
            };

            expect(error.statusCode).to.equal(400);
            expect(error.error).to.eql(response);
        }
    });

    it('should throw error on incorrect _id field', async () => {
        try {
            await request.post(`${helpers.API_URL}/api/v1/merchants/${uuid.v4()}/user-group`, {
                body: {
                    _id: '123'
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

    it('should throw error if the document already exists', async () => {
        
        const collection = await getMongodbCollection('Users');
        await collection.insertOne(sampleUserGroup);

        try {
            await request.post(`${helpers.API_URL}/api/v1/merchants/${uuid.v4()}/user-group`, {
                body: sampleUserGroup,
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            const response = {
                code: 409,
                description: 'You\'ve requested to create a new userGroups but a userGroups with the specified _id field already exists.',
                reasonPhrase: 'DuplicateUserGroupError'
            };

            expect(error.statusCode).to.equal(409);
            expect(error.error).to.eql(response);

            const collection = await getMongodbCollection('Users');
            await collection.deleteOne({ _id: sampleUserGroup._id, docType: 'userGroups', partitionKey: sampleUserGroup._id });
        }
    });

    it('should create document when all validation passes', async () => {

        const user = await request.post(`${helpers.API_URL}/api/v1/merchants/${uuid.v4()}/user-group`, {
            body: sampleUserGroup,
            json: true,
            headers: {
                'x-functions-key': process.env.X_FUNCTIONS_KEY
            }
        });
        expect(user).not.to.be.null;
        expect(user._id).to.equal(sampleUserGroup._id);
        expect(user.docType).to.equal('userGroups');


    });


    after(async () => {
        const collection = await getMongodbCollection('Users');
        await collection.deleteOne({ _id: sampleUserGroup._id, docType: 'userGroups', partitionKey: sampleUserGroup._id });
        
    });
});
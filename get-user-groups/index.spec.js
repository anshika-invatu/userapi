'use strict';

const expect = require('chai').expect;
const helpers = require('../spec/helpers');
const request = require('request-promise');
const uuid = require('uuid');
const sampleUserGroup = { ...require('../spec/sample-docs/UserGroups'), _id: uuid.v4() };
const { getMongodbCollection } = require('../db/mongodb');
sampleUserGroup.partitionKey = sampleUserGroup._id;

describe('get user groups by merchant id', () => {
    before(async () => {
        sampleUserGroup.partitionKey = sampleUserGroup._id;
        const collection = await getMongodbCollection('Users');
        await collection.insertOne(sampleUserGroup);
    });
    it('should throw error on incorrect _id field', async () => {
        try {
            await request.get(`${helpers.API_URL}/api/v1/merchants/${'123'}/user-groups`, {
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            const response = {
                code: 400,
                description: 'The merchantID field specified in the request body does not match the UUID v4 format.',
                reasonPhrase: 'InvalidUUIDError'
            };

            expect(error.statusCode).to.equal(400);
            expect(error.error).to.eql(response);
        }
    });

    it('should throw error if the document not exists', async () => {

        
        const result = await request.get(`${helpers.API_URL}/api/v1/merchants/${uuid.v4()}/user-groups`, {
            json: true,
            headers: {
                'x-functions-key': process.env.X_FUNCTIONS_KEY
            }
        });
        expect(result).not.to.be.null;
        expect(result).to.be.instanceOf(Array).and.have.lengthOf(0);
    
    });

    it('should create document when all validation passes', async () => {

        const user = await request.get(`${helpers.API_URL}/api/v1/merchants/${sampleUserGroup.merchantID}/user-groups`, {
            json: true,
            headers: {
                'x-functions-key': process.env.X_FUNCTIONS_KEY
            }
        });
        expect(user).not.to.be.null;
        expect(user[0].docType).to.equal('userGroups');


    });


    after(async () => {
        const collection = await getMongodbCollection('Users');
        await collection.deleteOne({ _id: sampleUserGroup._id, docType: 'userGroups', partitionKey: sampleUserGroup._id });
        
    });
});
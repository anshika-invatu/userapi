'use strict';

const expect = require('chai').expect;
const helpers = require('../spec/helpers');
const request = require('request-promise');
const uuid = require('uuid');
const sampleTeams = { ...require('../spec/sample-docs/Teams'), _id: uuid.v4() };
const { getMongodbCollection } = require('../db/mongodb');
sampleTeams.partitionKey = sampleTeams._id;
sampleTeams.merchantID = uuid.v4();

describe('Update Team', () => {
    before(async () => {
        const collection = await getMongodbCollection('Users');
        await collection.insertOne(sampleTeams);
    });
    it('should return status code 400 when request body is null', async () => {
        try {
            await request.patch(helpers.API_URL + '/api/v1/merchants/123/teams/123', {
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            const response = {
                code: 400,
                description: 'You\'ve requested to update a team but the request body seems to be empty. Kindly pass the request body in application/json format',
                reasonPhrase: 'EmptyRequestBodyError'
            };

            expect(error.statusCode).to.equal(400);
            expect(error.error).to.eql(response);
        }
    });

    it('should throw error on incorrect id field', async () => {
        try {
            await request.patch(`${helpers.API_URL}/api/v1/merchants/123/teams/${uuid.v4()}`, {
                body: {},
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            const response = {
                code: 400,
                description: 'The merchant id field specified in the request body does not match the UUID v4 format.',
                reasonPhrase: 'InvalidUUIDError'
            };

            expect(error.statusCode).to.equal(400);
            expect(error.error).to.eql(response);
        }
    });

    it('should throw error if the document not exists', async () => {
        try {
            await request.patch(`${helpers.API_URL}/api/v1/merchants/${uuid.v4()}/teams/${uuid.v4()}`, {
                body: {
                },
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            const response = {
                code: 404,
                description: 'The team id specified in the URL doesn\'t exist.',
                reasonPhrase: 'TeamNotFoundError'
            };

            expect(error.statusCode).to.equal(404);
            expect(error.error).to.eql(response);
        }
    });

    it('should update document when all validation passes', async () => {

        const result = await request.patch(`${helpers.API_URL}/api/v1/merchants/${sampleTeams.merchantID}/teams/${sampleTeams._id}`, {
            body: {
                'name': 'test'
            },
            json: true,
            headers: {
                'x-functions-key': process.env.X_FUNCTIONS_KEY
            }
        });
        expect(result).not.to.be.null;
        expect(result.description).to.equal('Successfully updated the document');
    });


    after(async () => {
        const collection = await getMongodbCollection('Users');
        await collection.deleteOne({ _id: sampleTeams._id, docType: 'teams', partitionKey: sampleTeams._id });
        
    });
});
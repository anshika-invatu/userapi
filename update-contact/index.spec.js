'use strict';

const expect = require('chai').expect;
const helpers = require('../spec/helpers');
const request = require('request-promise');
const uuid = require('uuid');
const sampleContacts = { ...require('../spec/sample-docs/Contacts'), _id: uuid.v4(), merchantID: uuid.v4() };
const { getMongodbCollection } = require('../db/mongodb');
sampleContacts.partitionKey = sampleContacts._id;

describe('Update Contact', () => {

    before(async () => {
        const collection = await getMongodbCollection('Users');
        await collection.insertOne(sampleContacts);

    });

    it('should throw error on incorrect merchant id field', async () => {
        try {
            await request.patch(`${helpers.API_URL}/api/v1/merchants/123/contact/123`, {
                body: { _id: 'abc-123' },
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            const response = {
                code: 400,
                description: 'The merchant id specified in the URL does not match the UUID v4 format.',
                reasonPhrase: 'InvalidUUIDError'
            };
            expect(error.statusCode).to.equal(400);
            expect(error.error).to.eql(response);
        }
    });
    it('should throw error on incorrect contact id field', async () => {
        try {
            await request.patch(`${helpers.API_URL}/api/v1/merchants/${uuid.v4()}/contact/123`, {
                body: { _id: 'abc-123' },
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            const response = {
                code: 400,
                description: 'The contact id specified in the URL does not match the UUID v4 format.',
                reasonPhrase: 'InvalidUUIDError'
            };
            expect(error.statusCode).to.equal(400);
            expect(error.error).to.eql(response);
        }
    });

    it('should update the document when all validation passes', async () => {
        const result = await request.patch(`${helpers.API_URL}/api/v1/merchants/${sampleContacts.merchantID}/contact/${sampleContacts._id}`, {
            body: sampleContacts,
            json: true,
            headers: {
                'x-functions-key': process.env.X_FUNCTIONS_KEY
            }
        });

        expect(result).not.to.be.null;
        expect(result.description).to.eql('Successfully updated the specified contact');
    });


    it('should throw error if doc not exist in db.', async () => {
        try {
            await request.patch(`${helpers.API_URL}/api/v1/merchants/${sampleContacts.merchantID}/contact/${uuid.v4()}`, {
                body: sampleContacts,
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            const response = {
                code: 404,
                description: 'The contact id specified in the URL doesn\'t exist.',
                reasonPhrase: 'ContactsNotFoundError'
            };
            expect(error.statusCode).to.equal(404);
            expect(error.error).to.eql(response);
        }
    });


    after(async () => {
        const collection = await getMongodbCollection('Users');
        await collection.deleteOne({ _id: sampleContacts._id, docType: 'contacts', partitionKey: sampleContacts._id });

    });
});
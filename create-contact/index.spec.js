'use strict';

const expect = require('chai').expect;
const helpers = require('../spec/helpers');
const request = require('request-promise');
const uuid = require('uuid');
const sampleContacts = { ...require('../spec/sample-docs/Contacts'), _id: uuid.v4(), merchantID: uuid.v4() };
const { getMongodbCollection } = require('../db/mongodb');
sampleContacts.partitionKey = sampleContacts._id;

describe('Create Contact', () => {
    it('should throw error on incorrect id field', async () => {
        try {
            await request.post(`${helpers.API_URL}/api/v1/contact`, {
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

    it('should create the document when all validation passes', async () => {
        const result = await request.post(`${helpers.API_URL}/api/v1/contact`, {
            body: sampleContacts,
            json: true,
            headers: {
                'x-functions-key': process.env.X_FUNCTIONS_KEY
            }
        });

        expect(result).not.to.be.null;
        expect(result._id).to.equal(sampleContacts._id);
    });


    it('should throw error on duplicate doc.', async () => {
        try {
            await request.post(`${helpers.API_URL}/api/v1/contact`, {
                body: sampleContacts,
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            const response = {
                code: 409,
                description: 'You\'ve requested to create a new contacts but a contacts with the specified _id field already exists.',
                reasonPhrase: 'DuplicateContactsError'
            };
            expect(error.statusCode).to.equal(409);
            expect(error.error).to.eql(response);
        }
    });


    after(async () => {
        const collection = await getMongodbCollection('Users');
        await collection.deleteOne({ _id: sampleContacts._id, docType: 'contacts', partitionKey: sampleContacts._id });

    });
});
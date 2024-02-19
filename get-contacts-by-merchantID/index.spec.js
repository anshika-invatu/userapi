'use strict';

const expect = require('chai').expect;
const helpers = require('../spec/helpers');
const request = require('request-promise');
const uuid = require('uuid');
const sampleContacts = { ...require('../spec/sample-docs/Contacts'), _id: uuid.v4(), merchantID: uuid.v4() };
const { getMongodbCollection } = require('../db/mongodb');
sampleContacts.partitionKey = sampleContacts._id;

describe('Get Contacts by merchant', () => {

    before(async () => {
        const collection = await getMongodbCollection('Users');
        await collection.insertOne(sampleContacts);

    });

    it('should throw error on incorrect merchant id field', async () => {
        try {
            await request.get(`${helpers.API_URL}/api/v1/merchants/123/contacts`, {
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
    it('should update the document when all validation passes', async () => {
        const result = await request.get(`${helpers.API_URL}/api/v1/merchants/${sampleContacts.merchantID}/contacts`, {
            body: sampleContacts,
            json: true,
            headers: {
                'x-functions-key': process.env.X_FUNCTIONS_KEY
            }
        });

        expect(result).not.to.be.null;
        expect(result[0].docType).to.eql('contacts');
    });


    after(async () => {
        const collection = await getMongodbCollection('Users');
        await collection.deleteOne({ _id: sampleContacts._id, docType: 'contacts', partitionKey: sampleContacts._id });

    });
});
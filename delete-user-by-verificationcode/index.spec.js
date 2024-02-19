'use strict';

const expect = require('chai').expect;
const helpers = require('../spec/helpers');
const request = require('request-promise');
const uuid = require('uuid');
const sampleUser = { ...require('../spec/sample-docs/Users'), _id: uuid.v4() };
const sampleVerificationDoc = { ...require('../spec/sample-docs/VerificationCode'), _id: uuid.v4() };
const { getMongodbCollection } = require('../db/mongodb');
const crypto = require('crypto');
const randomString = crypto.randomBytes(3).toString('hex');
const email = `test.${randomString}@vourity.com`;
const moment = require('moment');
sampleUser.email = email;

describe('Delete user', () => {
    before(async () => {
        sampleUser.partitionKey = sampleUser._id;
        const collection = await getMongodbCollection('Users');
        sampleVerificationDoc.partitionKey = sampleUser._id;
        sampleVerificationDoc.userID = sampleUser._id;
        sampleVerificationDoc.verificationCode = 12345678;
        sampleVerificationDoc.codeExpiryDate = moment.utc().add(1, 'd')
            .toDate();
        await collection.insertOne(sampleUser);
        await collection.insertOne(sampleVerificationDoc);
    });

    it('should throw error if verfication do not match', async () => {
        try {
            await request.delete(`${helpers.API_URL}/api/v1/delete-user/78910123?userID=${sampleUser._id}`, {
                json: true,
                headers: {
                    'x-functions-key': process.env.X_FUNCTIONS_KEY
                }
            });
        } catch (error) {
            const response = {
                code: 400,
                description: 'User deletion request failed',
                reasonPhrase: 'UserDeleteError'
            };
            expect(error.statusCode).to.equal(400);
            expect(error.error).to.eql(response);
        }
    });



    it('should delete the document when all validation passes', async () => {
        const user = await request.delete(`${helpers.API_URL}/api/v1/delete-user/12345678?userID=${sampleUser._id}`, {
            json: true,
            headers: {
                'x-functions-key': process.env.X_FUNCTIONS_KEY
            }
        });

        expect(user).not.to.be.null;
        expect(user).to.eql({
            code: 200,
            description: 'Successfully deleted the user'
        });
    });

    after(async () => {
        const collection = await getMongodbCollection('Users');
        const deletedUser = await collection.findOne({ email: email, docType: 'deletedUsers' });
        await collection.deleteOne({ _id: deletedUser._id, docType: 'deletedUsers', partitionKey: deletedUser._id });

    });

});
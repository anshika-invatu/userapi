'use strict';

const { getMongodbCollection } = require('../db/mongodb');
const utils = require('../utils');
const Promise = require('bluebird');
const errors = require('../errors');

module.exports = async (context, req) => {
    if (!req.body) {
        utils.setContextResError(
            context,
            new errors.EmptyRequestBodyError(
                'You\'ve requested to create a new team but the request body seems to be empty. Kindly pass the team to be created using request body in application/json format',
                400
            )
        );
        return Promise.resolve();
    }
    try {
        await utils.validateUUIDField(context, `${req.body._id}`, 'The _id field specified in the request body does not match the UUID v4 format.');
        
        const userCollection = await getMongodbCollection('Users');

        const response = await userCollection.insertOne(Object.assign(
            {},
            req.body,
            {
                docType: 'teams',
                partitionKey: req.body._id,
                createdDate: new Date(),
                updatedDate: new Date()
            }
        ));


        if (response) {
            context.res = {
                body: response.ops[0]
            };
        }
    } catch (error) {
        utils.handleError(context, error);
    }
};

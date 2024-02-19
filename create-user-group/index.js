'use strict';

const { getMongodbCollection } = require('../db/mongodb');
const utils = require('../utils');
const Promise = require('bluebird');
const errors = require('../errors');

module.exports = async (context, req) => {
    try {
        if (!req.body) {
            utils.setContextResError(
                context,
                new errors.EmptyRequestBodyError(
                    'You\'ve requested to create a new user-group but the request body seems to be empty. Kindly pass the user-group to be created using request body in application/json format',
                    400
                )
            );
            return Promise.resolve();
        }
   
        await utils.validateUUIDField(context, `${req.body._id}`, 'The _id field specified in the request body does not match the UUID v4 format.');
        const collection = await getMongodbCollection('Users');

        const result = await collection.insertOne(Object.assign(
            {},
            req.body,
            {
                docType: 'userGroups',
                partitionKey: req.body._id,
                merchantID: req.params.id,
                createdDate: new Date(),
                updatedDate: new Date()
            }
        ));

        context.res = {
            body: result.ops[0]
        };
    } catch (error) {
        utils.handleError(context, error);
    }
};

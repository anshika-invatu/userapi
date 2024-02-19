'use strict';

const { getMongodbCollection } = require('../db/mongodb');
const utils = require('../utils');
const Promise = require('bluebird');
const errors = require('../errors');

//BASE-16
module.exports = async (context, req) => {
    try {
        if (!req.body) {
            utils.setContextResError(
                context,
                new errors.EmptyRequestBodyError(
                    'You\'ve requested to create a new user widgets but the request body seems to be empty. Kindly pass the user widgets to be created using request body in application/json format',
                    400
                )
            );
            return Promise.resolve();
        }
        await utils.validateUUIDField(context, `${req.body._id}`, 'The _id field specified in the request body does not match the UUID v4 format.');
        const collection = await getMongodbCollection('Users');
        const merchantIDs = new Array();
        for (const key in req.body.merchants) {
            merchantIDs.push(key);
        }
        const user = Object.assign(
            {},
            req.body,
            {
                docType: 'userWidgets',
                merchantIDs: merchantIDs,
                partitionKey: req.body.userID,
                createdDate: new Date(),
                updatedDate: new Date()
            }
        );
        const response = await collection.insertOne(user);
        if (response) {
            const user = response.ops[0];
            context.res = {
                body: user
            };
        }
    } catch (error) {
        utils.handleError(context, error);
    }
};

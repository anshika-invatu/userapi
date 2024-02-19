'use strict';

const { getMongodbCollection } = require('../db/mongodb');
const utils = require('../utils');
const Promise = require('bluebird');
const errors = require('../errors');
const bcrypt = require('bcryptjs');

module.exports = (context, req) => {
    const executionStart = new Date();
    if (!req.body) {
        utils.setContextResError(
            context,
            new errors.EmptyRequestBodyError(
                'You\'ve requested to create a new user but the request body seems to be empty. Kindly pass the user to be created using request body in application/json format',
                400
            )
        );
        return Promise.resolve();
    }
    let userCollection;
    return utils
        .validateUUIDField(context, `${req.body._id}`, 'The _id field specified in the request body does not match the UUID v4 format.')
        .then(() => getMongodbCollection('Users'))
        .then(collection => {
            userCollection = collection;
            var query = [];
            if (req.body.email) {
                query.push({ email: req.body.email });
            }
            if (req.body.mobilePhone) {
                query.push({ mobilePhone: req.body.mobilePhone });
            }
            return collection.find({
                $or: query,
                docType: 'users'
            }).toArray();
        })
        .then(result => {
            if (result && Array.isArray(result) && result.length > 0) {
                utils.setContextResError(
                    context,
                    new errors.DuplicateUserError(
                        'You\'ve requested to create a new user but a user with the specified _id field already exists.',
                        409
                    )
                );
                return Promise.resolve();
            } else {
                const user = Object.assign(
                    {},
                    req.body,
                    {
                        docType: 'users',
                        partitionKey: req.body._id, //cahnge partitionKey in the bac-149
                        createdDate: new Date(),
                        updatedDate: new Date()
                    }
                );
                var salt = bcrypt.genSaltSync(12);
                var hash = bcrypt.hashSync(user.password, salt);
                user.password = hash;
                return userCollection.insertOne(user);
            }
        })
        .then(response => {
            if (response) {
                const logMessage = {};
                logMessage.responseTime = `${(new Date() - executionStart)} ms`; // duration in ms
                logMessage.userID = req.body._id;
                logMessage.code = 200;
                logMessage.operation = 'Create';
                logMessage.result = 'Create User call completed successfully';
                utils.logInfo(logMessage);
                const user = response.ops[0];
                context.res = {
                    body: user
                };
            }
        })
        .catch(error => utils.handleError(context, error));
};

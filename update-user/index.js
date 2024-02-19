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
                'You\'ve requested to update a user but the request body seems to be empty. Kindly specify the user properties to be updated using request body in application/json format',
                400
            )
        );
        return Promise.resolve();
    }

    return utils
        .validateUUIDField(context, req.params.id)
        .then(() => getMongodbCollection('Users'))
        .then(collection => {
            if (Object.keys(req.body).length) {
                if (req.body.password) {
                    var salt = bcrypt.genSaltSync(12);
                    var hash = bcrypt.hashSync(req.body.password, salt);
                    req.body.password = hash;
                }
                return collection.updateOne({
                    _id: req.params.id,
                    partitionKey: req.params.id,//cahnge partitionKey in the bac-149
                    docType: 'users'
                }, {
                    $set: Object.assign(
                        {},
                        req.body,
                        {
                            updatedDate: new Date()
                        }
                    )
                });
            } else {
                return Promise.resolve();
            }
        })
        .then(result => {
            if (result) {
                if (result.matchedCount) {
                    const logMessage = {};
                    logMessage.responseTime = `${(new Date() - executionStart)} ms`; // duration in ms
                    logMessage.userID = req.params.id;
                    logMessage.code = 200;
                    logMessage.operation = 'Update';
                    logMessage.result = 'Update User call completed successfully';
                    utils.logInfo(logMessage);
                    context.res = {
                        body: {
                            code: 200,
                            description: 'Successfully updated the document'
                        }
                    };
                } else {
                    utils.setContextResError(
                        context,
                        new errors.UserNotFoundError(
                            'The user id specified in the URL doesn\'t exist.',
                            404
                        )
                    );
                }
            } else {
                utils.setContextResError(
                    context,
                    new errors.EmptyRequestBodyError(
                        'You\'ve requested to update a user but the request body seems to be empty. Kindly specify the user properties to be updated using request body in application/json format',
                        400
                    )
                );
            }
        })
        .catch(error => utils.handleError(context, error));
};

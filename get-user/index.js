'use strict';

const { getMongodbCollection } = require('../db/mongodb');
const utils = require('../utils');
const errors = require('../errors');

module.exports = (context, req) => {
    const executionStart = new Date();
    return utils
        .validateUUIDField(context, req.params.id)
        .then(() => getMongodbCollection('Users'))
        .then(collection => collection.findOne({
            _id: req.params.id,
            partitionKey: req.params.id,//cahnge partitionKey in the bac-149
            docType: 'users'
        }))
        .then(user => {
            if (user) {
                const logMessage = {};
                logMessage.responseTime = `${(new Date() - executionStart)} ms`; // duration in ms
                logMessage.userID = req.params.id;
                logMessage.code = 200;
                logMessage.operation = 'Get';
                logMessage.result = 'Get User call completed successfully';
                utils.logInfo(logMessage);
                context.res = {
                    body: user
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
        })
        .catch(error => utils.handleError(context, error));
};

'use strict';

const { getMongodbCollection } = require('../db/mongodb');
const utils = require('../utils');
const Promise = require('bluebird');
const errors = require('../errors');
const bcrypt = require('bcryptjs');
const notificationUtils = require('../utils/notificationsEmail');

//Please refer bac-198 for this endpoint related details

module.exports = function (context, req) {

    if (!req.body) {
        utils.setContextResError(
            context,
            new errors.EmptyRequestBodyError(
                'You\'ve requested to reset password but the request body seems to be empty. Kindly pass the new password and resetRequestID in request body in application/json format',
                400
            )
        );
        return Promise.resolve();
    }
    if (!req.body.resetRequestID || !req.body.newPassword) {
        utils.setContextResError(
            context,
            new errors.FieldValidationError(
                'Please provide resetRequestID and newPassword fields in the request body',
                400
            )
        );
        return Promise.resolve();
    }
    let userCollection, userID;
    const executionStart = new Date();
    return utils
        .validateUUIDField(context, req.body.resetRequestID)
        .then(() => getMongodbCollection('Users'))
        .then(collection => {
            userCollection = collection;
            return collection.findOne({
                _id: req.body.resetRequestID,
                partitionKey: req.body.resetRequestID,
                docType: 'passwordResetRequest'
            });
        })
        .then(passwordRequestDoc => {
            if (passwordRequestDoc && passwordRequestDoc.userID) {
                userID = passwordRequestDoc.userID;
                var salt = bcrypt.genSaltSync(12);
                var hash = bcrypt.hashSync(req.body.newPassword, salt);
                const newPassword = hash;
                return userCollection.updateOne({
                    _id: passwordRequestDoc.userID,
                    partitionKey: passwordRequestDoc.userID,
                    docType: 'users'
                }, {
                    $set: {
                        password: newPassword,
                        isLocked: false,
                        updatedDate: new Date()
                    }
                });
            } else {
                utils.setContextResError(
                    context,
                    new errors.PasswordResetRequestError(
                        'Request failed',
                        404
                    )
                );
            }
        })
        .then(result => {
            if (result) {
                return userCollection.deleteOne({
                    _id: req.body.resetRequestID,
                    partitionKey: req.body.resetRequestID,
                    docType: 'passwordResetRequest'
                });
            }
        })
        .then(result => {
            if (result) {
                notificationUtils.vourityPasswordResetEmail(userID);
                const logMessage = {};
                logMessage.responseTime = `${(new Date() - executionStart)} ms`; // duration in ms
                logMessage.userID = userID;
                logMessage.code = 200;
                logMessage.result = 'Forgotten Password Confirm call completed successfully';
                utils.logInfo(logMessage);
                context.res = {
                    body: {
                        code: 200,
                        description: 'Password reset successfully'
                    }
                };
            }
        })
        .catch(error => {
            utils.handleError(context, error);
        });
};
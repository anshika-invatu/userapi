'use strict';

const utils = require('../utils');
const errors = require('../errors');
const {
    getMongodbCollection
} = require('../db/mongodb');
const uuid = require('uuid');
const passwordResetRequest = require('../spec/sample-docs/PasswordResetRequest');
const notificationUtils = require('../utils/notificationsEmail');

module.exports = (context, req) => {
    if (!req.body) {
        utils.setContextResError(
            context,
            new errors.EmptyRequestBodyError(
                'You\'ve requested to change password but the request body seems to be empty.',
                400
            )
        );
        return Promise.resolve();
    }

    var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!re.test(String(req.body.email).toLowerCase()) || req.body.email.length > 200) {
        utils.setContextResError(
            context,
            new errors.FieldValidationError(
                'Please provide email address',
                400
            )
        );
        return Promise.resolve();
    }

    let collection;
    return getMongodbCollection('Users')
        .then(userCollection => {
            collection = userCollection;
            const emailRegex = new RegExp('^' + req.body.email + '$', 'i');
            return collection.findOne({
                email: emailRegex
            });
        })
        .then(result => {
            if (result) {
                passwordResetRequest._id = uuid.v4();
                passwordResetRequest.partitionKey = passwordResetRequest._id;
                passwordResetRequest.userID = result._id;
                passwordResetRequest.requestExpiryDate = new Date();
                passwordResetRequest.requestExpiryDate.setHours(+passwordResetRequest.requestExpiryDate.getHours() + 4);
                passwordResetRequest.createdDate = new Date();
                passwordResetRequest.updatedDate = new Date();
                passwordResetRequest._ts = passwordResetRequest.createdDate;
                passwordResetRequest.ttl = 60 * 60 * 4;
                collection.insertOne(passwordResetRequest);

                const url = process.env.PASSWORD_RESET_URL + '/resetrequest/' + passwordResetRequest._id;
                notificationUtils.vourityPasswordResetUrlEmail(result._id, url);
            } else {
                context.log.info({
                    _id: result._id,
                    description: 'Password reset request - No matching user found',
                    timestamp: new Date()
                });
            }
            context.res = {
                body: {
                    code: 200,
                    description: 'Password reset request received successfully'
                }
            };
        })
        .catch(() => { //If user not found, still respond with 200 ok so as to prevent hackers from checking if an e-mail exists or not.
            context.res = {
                body: {
                    code: 200,
                    description: 'Password reset request received successfully'
                }
            };
        });
};
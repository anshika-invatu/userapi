'use strict';

const uuid = require('uuid');
const utils = require('../utils');
const errors = require('../errors');
const { getMongodbCollection } = require('../db/mongodb');

//Please refer bac-192 for this endpoint related details

module.exports = (context, req) => {
    const executionStart = new Date();
    let userCollection,deletedUser;
    return getMongodbCollection('Users')
        .then(collection => {
            userCollection = collection;
            return collection.findOne({
                userID: req.query.userID,
                partitionKey: req.query.userID,
                verificationCode: Number(req.params.verificationCode),
                docType: 'verificationCode',
                action: 'delete',
                object: 'user'
            });
        })
        .then(verificationCodeDoc => {
            const currentDate = new Date();
            if (!verificationCodeDoc || verificationCodeDoc.codeExpiryDate < currentDate) {
                utils.setContextResError(
                    context,
                    new errors.UserDeleteError(
                        'User deletion request failed',
                        400
                    )
                );
            } else {
                return userCollection.findOne({
                    _id: req.query.userID,
                    partitionKey: req.query.userID,
                    docType: 'users'
                });
            }
        })
        .then(user => {
            if (user) {
                deletedUser = Object.assign({}, user);
                user._id = uuid.v4();
                user.docType = 'deletedUsers';
                user.partitionKey = user._id;
                user.ttl = 30 * 60 * 60 * 24; // expire after 30 days
                userCollection.deleteOne({
                    _id: req.query.userID,
                    partitionKey: req.query.userID,
                    docType: 'users'
                });

                return userCollection.insertOne(user);
            }
        })
        .then(result => {
            if (result && result.ops[0]) {
                userCollection.deleteOne({
                    userID: req.query.userID,
                    partitionKey: req.query.userID,
                    docType: 'verificationCode',
                    action: 'delete',
                    object: 'user'
                });
                utils.sendMessageToAzureBus(process.env.AZURE_BUS_TOPIC_USER_DELETE,deletedUser);
                const logMessage = {};
                logMessage.responseTime = `${(new Date() - executionStart)} ms`; // duration in ms
                logMessage.userID = req.query.userID;
                logMessage.code = 200;
                logMessage.operation = 'Delete';
                logMessage.result = 'Delete User by verification code call completed successfully';
                utils.logInfo(logMessage);
                context.res = {
                    body: {
                        code: 200,
                        description: 'Successfully deleted the user'
                    }
                };
            }

        })
        .catch(error => utils.handleError(context, error));
};


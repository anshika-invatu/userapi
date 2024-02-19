'use strict';

const uuid = require('uuid');
const moment = require('moment');
const utils = require('../utils');
const errors = require('../errors');
const { getMongodbCollection } = require('../db/mongodb');
const notificationUtils = require('../utils/notificationsEmail');

//Please refer bac-190.

module.exports = (context, req) => {
    if (!req.body) {
        utils.setContextResError(
            context,
            new errors.EmptyRequestBodyError(
                'You\'ve requested to create a validation code but the request body seems to be empty. Kindly pass the userID and event for creating a validation code',
                400
            )
        );
        return Promise.resolve();
    }
    const varificationCode = utils.makeCode(8);
    return utils
        .validateUUIDField(context, `${req.body._id}`, 'The _id field specified in the request body does not match the UUID v4 format.')
        .then(() => getMongodbCollection('Users'))
        .then(collection => {
            const varificationCodeDoc = {};
            varificationCodeDoc._id = uuid.v4();
            varificationCodeDoc.docType = 'verificationCode';
            varificationCodeDoc.partitionKey = req.body._id;
            varificationCodeDoc.action = req.body.action;
            varificationCodeDoc.object = 'user';
            varificationCodeDoc.userID = req.body._id;
            varificationCodeDoc.verificationCode = Number(varificationCode);
            varificationCodeDoc.codeExpiryDate = moment.utc().add(15, 'm')
                .toDate();
            varificationCodeDoc.createdDate = new Date();
            varificationCodeDoc.updatedDate = new Date();
            varificationCodeDoc._ts = varificationCodeDoc.createdDate;
            varificationCodeDoc.ttl = 60 * 15;
            return collection.insertOne(varificationCodeDoc);
        })
        .then(result => {
            if (result && result.ops[0]) {
                notificationUtils.sendVerificationCodeEmail(varificationCode, req.body._id);
                context.res = {
                    body: result.ops[0]
                };
            }
        })
        .catch(error => utils.handleError(context, error));
};


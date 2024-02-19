'use strict';

const { getMongodbCollection } = require('../db/mongodb');
const utils = require('../utils');
const Promise = require('bluebird');
const errors = require('../errors');

module.exports = async (context, req) => {
    try {

        await utils.validateUUIDField(context, `${req.params.userGroupID}`, 'The userGroupID field specified in the request body does not match the UUID v4 format.');
        const collection = await getMongodbCollection('Users');

        const result = await collection.findOne(
            {
                _id: req.params.userGroupID,
                docType: 'userGroups',
                partitionKey: req.params.userGroupID,
                merchantID: req.params.id
            });
        if (!result) {
            utils.setContextResError(
                context,
                new errors.UserGroupNotFoundError(
                    'The user group id specified in the URL doesn\'t exist.',
                    404
                )
            );
            return Promise.resolve();
        }
        context.res = {
            body: result
        };
    } catch (error) {
        utils.handleError(context, error);
    }
};

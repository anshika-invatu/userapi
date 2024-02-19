'use strict';

const { getMongodbCollection } = require('../db/mongodb');
const utils = require('../utils');
const Promise = require('bluebird');
const errors = require('../errors');

module.exports = async (context, req) => {
    if (!req.body) {
        utils.setContextResError(
            context,
            new errors.EmptyRequestBodyError(
                'You\'ve requested to update a team but the request body seems to be empty. Kindly pass the request body in application/json format',
                400
            )
        );
        return Promise.resolve();
    }
    try {
        await utils.validateUUIDField(context, `${req.params.id}`, 'The merchant id field specified in the request body does not match the UUID v4 format.');
        
        const userCollection = await getMongodbCollection('Users');

        const response = await userCollection.updateOne({
            _id: req.params.teamID,
            partitionKey: req.params.teamID,
            merchantID: req.params.id,
            docType: 'teams'
        }, {
            $set: Object.assign(
                {},
                req.body,
                {
                    updatedDate: new Date()
                }
            )
        });


        if (response && response.matchedCount) {
            context.res = {
                body: {
                    code: 200,
                    description: 'Successfully updated the document'
                }
            };
        } else {
            utils.setContextResError(
                context,
                new errors.TeamNotFoundError(
                    'The team id specified in the URL doesn\'t exist.',
                    404
                )
            );
        }
    } catch (error) {
        utils.handleError(context, error);
    }
};

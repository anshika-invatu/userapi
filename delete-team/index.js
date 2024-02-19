'use strict';

const { getMongodbCollection } = require('../db/mongodb');
const utils = require('../utils');
const errors = require('../errors');

module.exports = async (context, req) => {
    
    try {
        await utils.validateUUIDField(context, `${req.params.id}`, 'The merchant id field specified in the request body does not match the UUID v4 format.');
        
        const userCollection = await getMongodbCollection('Users');

        const response = await userCollection.deleteOne({
            _id: req.params.teamID,
            partitionKey: req.params.teamID,
            merchantID: req.params.id,
            docType: 'teams'
        });


        if (response && response.deletedCount === 1) {
            context.res = {
                body: {
                    code: 200,
                    description: 'Successfully deleted the document'
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

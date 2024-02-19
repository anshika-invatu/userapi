'use strict';

const { getMongodbCollection } = require('../db/mongodb');
const utils = require('../utils');
const errors = require('../errors');

//BASE-16
module.exports = async (context, req) => {
    try {

        const collection = await getMongodbCollection('Users');

        const response = await collection.deleteOne({
            userID: req.params.userID,
            partitionKey: req.params.userID,
            docType: 'userWidgets',
            merchantIDs: req.params.id
        });
        if (response && response.deletedCount) {
            context.res = {
                body: {
                    code: 200,
                    description: 'Successfully deleted the document'
                }
            };
        } else {
            utils.setContextResError(
                context,
                new errors.UserWidgetsNotFoundError(
                    'The user widgets details specified in the URL doesn\'t exist.',
                    404
                )
            );
        }
    } catch (error) {
        await utils.handleError(context, error);
    }
};

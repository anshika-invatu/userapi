'use strict';

const { getMongodbCollection } = require('../db/mongodb');
const utils = require('../utils');

module.exports = async (context, req) => {
    try {

        await utils.validateUUIDField(context, `${req.params.id}`, 'The merchantID field specified in the request body does not match the UUID v4 format.');
        const collection = await getMongodbCollection('Users');

        const result = await collection.find(
            {
                docType: 'userGroups',
                merchantID: req.params.id
            }).toArray();
      
        context.res = {
            body: result
        };
    } catch (error) {
        utils.handleError(context, error);
    }
};

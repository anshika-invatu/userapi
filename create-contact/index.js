'use strict';

const { getMongodbCollection } = require('../db/mongodb');
const utils = require('../utils');


//BASE-552
module.exports = async (context, req) => {
    try {

        await utils.validateUUIDField(context, req.body._id, 'The contact id specified in the URL does not match the UUID v4 format.');
        const collection = await getMongodbCollection('Users');
        const result = await collection.insertOne(Object.assign(
            {},
            req.body,
            {
                docType: 'contacts',
                createdDate: new Date(),
                updatedDate: new Date(),
                partitionKey: req.body._id
            }
        ));
        if (result) {
            context.res = {
                body: result.ops[0]
            };
        }
    } catch (error) {
        utils.handleError(context, error);
    }
};

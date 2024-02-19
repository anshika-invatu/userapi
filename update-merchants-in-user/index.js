'use strict';

const { getMongodbCollection } = require('../db/mongodb');
const utils = require('../utils');



module.exports = async function (context, req) {
    try {
        await utils.validateUUIDField(context, req.params.userID);
        const collection = await getMongodbCollection('Users');
        if (req.method === 'POST') {
            const updatedUser = await collection.updateOne({
                _id: req.params.userID,
                partitionKey: req.params.userID,
                docType: 'users'
            },
            {
                $push: { merchants: req.body }
            });
            if (updatedUser && updatedUser.matchedCount) {
                context.res = {
                    body: {
                        code: 200,
                        description: 'Successfully updated the document'
                    }
                };
            }
        } else if (req.method === 'DELETE') {
            const updatedUser = await collection.updateOne({
                _id: req.params.userID,
                partitionKey: req.params.userID,
                docType: 'users'
            },
            {
                $pull: { merchants: { merchantID: req.params.id }}
            });
            if (updatedUser && updatedUser.matchedCount) {
                context.res = {
                    body: {
                        code: 200,
                        description: 'Successfully updated the document'
                    }
                };
            }
        }
        return Promise.resolve();
    } catch (error) {
        error => utils.handleError(context, error);
    }
};
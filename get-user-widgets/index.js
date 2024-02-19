'use strict';

const { getMongodbCollection } = require('../db/mongodb');
const utils = require('../utils');
const errors = require('../errors');

//BASE-16
module.exports = async (context, req) => {
    try {

        await utils.validateUUIDField(context, `${req.params.userID}`, 'The userID field specified in the request does not match the UUID v4 format.');
        await utils.validateUUIDField(context, `${req.params.id}`, 'The merchantID field specified in the request does not match the UUID v4 format.');
        const collection = await getMongodbCollection('Users');


        const response = await collection.find({
            userID: req.params.userID,
            partitionKey: req.params.userID,
            docType: 'userWidgets',
            merchantIDs: req.params.id
        }).toArray();
        if (response && Array.isArray(response)) {
            if (req.query.pageCode) {
                for (let i = 0; i < response.length; i++) {
                    let pageCode;
                    for (const key in response[i].merchants[req.params.id].pageCodes) {
                        if (key.toLowerCase() === req.query.pageCode.toLowerCase()) {
                            pageCode = response[i].merchants[req.params.id].pageCodes[key];
                        }
                    }
                    delete response[i].merchantIDs;
                    delete response[i].merchants[req.params.id].pageCodes;
                    response[i].merchants[req.params.id].pageCodes = {};
                    response[i].merchants[req.params.id].pageCodes[req.query.pageCode] = pageCode;
                }
            }
            context.res = {
                body: response
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

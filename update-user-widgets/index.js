'use strict';

const { getMongodbCollection } = require('../db/mongodb');
const utils = require('../utils');
const errors = require('../errors');
const uuid = require('uuid');
const Promise = require('bluebird');

//BASE-16
module.exports = async (context, req) => {
    try {

        if (!req.body) {
            utils.setContextResError(
                context,
                new errors.EmptyRequestBodyError(
                    'You\'ve requested to update a new user widgets but the request body seems to be empty. Kindly pass the user widgets to be created using request body in application/json format',
                    400
                )
            );
            return Promise.resolve();
        }

        await utils.validateUUIDField(context, `${req.params.userID}`, 'The userID field specified in the request does not match the UUID v4 format.');
        await utils.validateUUIDField(context, `${req.params.id}`, 'The merchantID field specified in the request does not match the UUID v4 format.');

        const collection = await getMongodbCollection('Users');
        const key = 'merchants.' + req.params.id + '.pageCodes.' + req.query.pageCode;

        const userWidgets = await collection.findOne({
            userID: req.params.userID,
            partitionKey: req.params.userID,
            docType: 'userWidgets',
            merchantIDs: req.params.id
        });
        let response;
        if (req.body[req.query.pageCode]) {
            req.body = req.body[req.query.pageCode];
        }
        if (userWidgets) {
            response = await collection.updateOne({
                userID: req.params.userID,
                partitionKey: req.params.userID,
                docType: 'userWidgets',
                merchantIDs: req.params.id
            }, {
                $set: {
                    [key]: Object.assign(
                        {},
                        req.body
                    )
                }
            });
        } else {
            response = await collection.insertOne({
                _id: uuid.v4(),
                userID: req.params.userID,
                partitionKey: req.params.userID,
                docType: 'userWidgets',
                merchantIDs: [req.params.id],
                merchants: {
                    [req.params.id]: {
                        pageCodes: {
                            [req.query.pageCode]: req.body
                        }
                    }
                },
                createdDate: new Date(),
                updatedDate: new Date()
            });
        }
        if (response && (response.matchedCount || response.ops)) {
            if (response.matchedCount) {
                context.res = {
                    body: {
                        code: 200,
                        description: 'Successfully updated the document'
                    }
                };
            } else if (response.ops) {
                context.res = {
                    body: response.ops[0]
                };
            }
        }
    } catch (error) {
        await utils.handleError(context, error);
    }
};

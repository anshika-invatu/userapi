'use strict';

const { getMongodbCollection } = require('../db/mongodb');
const utils = require('../utils');
const errors = require('../errors');

module.exports = (context, req) => {
    let userCollection;
    return getMongodbCollection('Users')
        .then(collection => {
            userCollection = collection;
            return collection.findOne({
                _id: req.body.userID,
                partitionKey: req.body.userID,
                merchants: { $elemMatch: { merchantID: req.body.merchantID }},
                docType: 'users'
            });
        })
        .then(user => {
            if (user) {
                const merchants = [];
                if (user.merchants && Array.isArray(user.merchants)) {
                    user.merchants.forEach(merchant => {
                        if (merchant.merchantID === req.body.merchantID) {
                            merchant.roles = req.body.role;
                        }
                        merchants.push(merchant);
                    });
                }
                return userCollection.updateOne({
                    _id: user._id,
                    partitionKey: user._id,
                    docType: 'users'
                }, {
                    $set: { merchants: merchants }
                });
            } else {
                utils.setContextResError(
                    context,
                    new errors.UserNotFoundError(
                        'No users exist of this userID',
                        404
                    )
                );
            }
        })
        .then(result => {
            if (result) {
                context.res = {
                    body: {
                        code: 200,
                        description: 'Successfully updated the role'
                    }
                };
            }
        })
        .catch(error => utils.handleError(context, error));
};

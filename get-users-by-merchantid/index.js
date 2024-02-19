'use strict';

const { getMongodbCollection } = require('../db/mongodb');
const utils = require('../utils');
const errors = require('../errors');

module.exports = (context,req) => {
    return getMongodbCollection('Users')
        .then(collection => {
            return collection.find({
                merchants: { $elemMatch: { merchantID: req.params.id }},
                docType: 'users'
            }).toArray();
        }
        )
        .then(users => {
            if (users && users.length) {
                context.res = {
                    body: users
                };
            } else {
                utils.setContextResError(
                    context,
                    new errors.UserNotFoundError(
                        'No users exist of this merchantID',
                        404
                    )
                );
            }
        })
        .catch(error => utils.handleError(context, error));
};

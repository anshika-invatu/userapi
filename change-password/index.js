'use strict';

const utils = require('../utils');
const errors = require('../errors');
const { getMongodbCollection } = require('../db/mongodb');
const bcrypt = require('bcryptjs');

module.exports = (context, req) => {
    
    if (!req.body) {
        utils.setContextResError(
            context,
            new errors.EmptyRequestBodyError(
                'You\'ve requested to change password but the request body seems to be empty.',
                400
            )
        );
        return Promise.resolve();
    }

    let collection;
    return utils
        .validateUUIDField(context, req.params.id)
        .then(() => getMongodbCollection('Users'))
        .then(userCollection => {
            collection = userCollection;
            return collection.findOne({
                _id: req.params.id,
                partitionKey: req.params.id
            });
        })
        .then(result => {
            if (!result) {
                utils.setContextResError(
                    context,
                    new errors.UserNotFoundError(
                        'The user with the id specified doesn\'t exist.',
                        404
                    )
                );
            } else if (bcrypt.compareSync(req.body.oldPassword, result.password)) {
                var salt = bcrypt.genSaltSync(12);
                var hash = bcrypt.hashSync(req.body.newPassword, salt);
                req.body.newPassword = hash;
                collection.updateOne({
                    _id: result._id,
                    docType: 'users',
                    partitionKey: req.params.id
                }, {
                    $set: Object.assign(
                        {},
                        result,
                        {
                            password: req.body.newPassword
                        }
                    )
                });
                context.res = {
                    body: {
                        code: 200,
                        description: 'Password Changed Successfully'
                    }
                };
            } else {
                utils.setContextResError(
                    context,
                    new errors.UserNotAuthenticatedError(
                        'Unable to authenticate user.',
                        401
                    )
                );
            }
        })
        .catch(error => utils.handleError(context, error));
};

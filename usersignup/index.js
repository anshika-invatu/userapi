'use strict';

const { getMongodbCollection } = require('../db/mongodb');
const utils = require('../utils');
const errors = require('../errors');

module.exports = (context, req) => {
    return utils
        .validateUUIDField(context, req.params.id)
        .then(() => getMongodbCollection('Users'))
        .then(collection => collection.findOne({
            _id: req.params.id,
            docType: 'userSignup'
        }))
        .then(user => {
            if (user) {
                context.res = {
                    body: user
                };
            } else {
                utils.setContextResError(
                    context,
                    new errors.UserNotFoundError(
                        'The user id specified in the URL doesn\'t exist.',
                        404
                    )
                );
            }
        })
        .catch(error => utils.handleError(context, error));
};

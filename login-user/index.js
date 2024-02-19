'use strict';

const { getMongodbCollection } = require('../db/mongodb');
const utils = require('../utils');
const Promise = require('bluebird');
const errors = require('../errors');
const bcrypt = require('bcryptjs');
const jwt = require('jwt-simple');
const moment = require('moment');
//Refer story bac-35,bac-42, bac-255 to understand login api
module.exports = (context, req) => {
    if (!req.body) {
        utils.setContextResError(
            context,
            new errors.EmptyRequestBodyError(
                'You have requested to authenticate a user but the request body seems to be empty. Kindly pass the user to be authenticated using request body in application/json format',
                400
            )
        );
        return Promise.resolve();
    }
    
    var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!re.test(String(req.body.email).toLowerCase()) || req.body.email.length > 200) {
        utils.setContextResError(
            context,
            new errors.FieldValidationError(
                'Please provide email address',
                400
            )
        );
        return Promise.resolve();
    }

    var pwlength = req.body.password.length;
    if (pwlength < 8 || pwlength > 50) {
        utils.setContextResError(
            context,
            new errors.FieldValidationError(
                'Password length must be minimum 8 characters or maximum 50 characters long.',
                400
            )
        );
        return Promise.resolve();
    }

    let collection;
    return getMongodbCollection('Users')
        .then(userCollection => {
            collection = userCollection;
            return collection.findOne({
                email: req.body.email,
                docType: 'users'
            });
        })
        .then(result => {
            if (!result) {
                utils.setContextResError(
                    context,
                    new errors.UserNotFoundError(
                        'The user with the email specified doesn\'t exist.',
                        404
                    )
                );
            } else if (result.isEnabled && !result.isLocked && bcrypt.compareSync(req.body.password, result.password)) {
                var expires = moment().utc() // set expiry date of 1 day
                    .add({ days: 1 })
                    .unix();
                var token = jwt.encode({
                    exp: expires,
                    email: result.email,
                    _id: result._id
                }, process.env.JWT_SECRET);
                context.res = {
                    body: { // Set jwt token to be returned back in response
                        code: 200,
                        token: token,
                        expires: moment.unix(expires).format(),
                        email: result.email
                    }
                };
                context.log(context.res);

                collection.updateOne({ // Update the lastLoginDate
                    _id: result._id,
                    docType: 'users',
                    partitionKey: result._id
                }, {
                    $set: Object.assign(
                        {},
                        result,
                        {
                            lastLoginDate: new Date()
                        }
                    )
                });

                context.log.info({   // Log in app insights
                    _id: result._id,
                    description: 'User Login Success',
                    timestamp: new Date()
                });

            } else {
                collection.updateOne({ // Update the lastFailedLoginDate
                    _id: result._id,
                    docType: 'users',
                    partitionKey: result._id
                }, {
                    $set: Object.assign(
                        {},
                        result,
                        {
                            lastFailedLoginDate: new Date()
                        }
                    )
                });

                context.log.info({   // Log in app insights
                    _id: result._id,
                    description: 'User Login Failed',
                    timestamp: new Date()
                });

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

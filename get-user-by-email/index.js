'use strict';

const { getMongodbCollection } = require('../db/mongodb');
const utils = require('../utils');
const validator = require('validator');

module.exports = (context, req) => {

    let emailRegex;
    if (validator.isEmail(`${req.params.details}`)) {
        emailRegex = new RegExp('^' + req.params.details + '$','i');
    }
    return getMongodbCollection('Users')
        .then(collection => {
            return collection.find({
                $or: [{ email: emailRegex },{ mobilePhone: req.params.details }], // check user for both email and mobile
                docType: 'users'
            }).toArray();
        }
        )
        .then(users => {
            if (users) {
                context.res = {
                    body: users
                };
            }
        })
        .catch(error => utils.handleError(context, error));
};

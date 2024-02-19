'use strict';

const { getMongodbCollection } = require('../db/mongodb');
const utils = require('../utils');
const Promise = require('bluebird');
const errors = require('../errors');
const uuid = require('uuid');
const userSignup = require('../spec/sample-docs/UserSignup');
const notificationUserSignup = require('../spec/sample-docs/Notification_UserSignup');

//Please refer bac-245, 391 for this endpoint related details

module.exports = (context, req) => {
    if (!req.body) {
        utils.setContextResError(
            context,
            new errors.EmptyRequestBodyError(
                'You have requested for signup but the request body seems to be empty.',
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
                'Please provide valid email address',
                400
            )
        );
        return Promise.resolve();
    }

    if (!req.body.iAmOlderThan18) {
        utils.setContextResError(
            context,
            new errors.FieldValidationError(
                'User must be 18 years old.',
                400
            )
        );
        return Promise.resolve();
    }

    if (!req.body.iAgreeToAgreement) {
        utils.setContextResError(
            context,
            new errors.FieldValidationError(
                'User must be agree to agreement.',
                400
            )
        );
        return Promise.resolve();
    }

    if (!req.body.iAgreeToTCandPrivacy) {
        utils.setContextResError(
            context,
            new errors.FieldValidationError(
                'User must be agree to privacy.',
                400
            )
        );
        return Promise.resolve();
    }
    let userCollection;
    return getMongodbCollection('Users')
        .then(collection => {
            userCollection = collection;
            const emailRegex = new RegExp('^' + req.body.email + '$','i');
            return collection.findOne({
                email: emailRegex,
                docType: 'users'
            });
        })
        .then(result => {
            if (result) {
                utils.setContextResError(
                    context,
                    new errors.DuplicateUserError(
                        'The user with this email id already exist',
                        409
                    )
                );
            } else {
                userSignup._id = uuid.v4();
                userSignup.country = req.body.country;
                userSignup.partitionKey = userSignup._id;
                userSignup.name = req.body.fullName;
                userSignup.company = req.body.companyName;
                userSignup.email = req.body.email;
                userSignup.signupExpiryDate = new Date();
                userSignup.signupExpiryDate.setHours(+userSignup.signupExpiryDate.getHours() + 24);
                userSignup.createdDate = new Date();
                userSignup.updatedDate = userSignup.createdDate;
                userSignup._ts = userSignup.createdDate;
                userSignup.ttl = 60 * 60 * 24;
                userSignup.consents.forEach(element => {
                    element.approvalDate = userSignup.createdDate;
                });

                var notificationMessge = Object.assign({}, notificationUserSignup);
                notificationMessge._id = uuid.v4();
                notificationMessge.receiver.userSignupID = userSignup._id;
                notificationMessge.templateFields = {
                    verificationUrl: process.env.SIGNUP_CONFIRM_URL + userSignup._id
                };
                notificationMessge.template = 'email-verification-signup';
                notificationMessge.updatedDate = new Date();
                notificationMessge.createdDate = new Date();
                utils.sendMessageToAzureBus(process.env.AZURE_BUS_TOPIC_NOTIFICATION_EMAIL, notificationMessge);

                notificationMessge.template = 'merchant-onboarding';
                notificationMessge._id = uuid.v4();
                notificationMessge.templateFields = {};
                notificationMessge.messageSubject = 'Merchant Onboarding';
                utils.sendMessageToAzureBus(process.env.AZURE_BUS_TOPIC_NOTIFICATION_EMAIL, notificationMessge);
                
                return userCollection.insertOne(userSignup);
            }
        })
        .then(response => {
            if (response) {
                const userSignup = response.ops[0];
                context.res = {
                    body: userSignup
                };
            }
        })
        .catch(error => utils.handleError(context, error));
};

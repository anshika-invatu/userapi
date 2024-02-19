'use strict';

const Promise = require('bluebird');
const validator = require('validator');
const errors = require('../errors');
const { MongoError } = require('mongodb');
var stripe = require('stripe')(process.env.STRIPE_API_KEY);
const moment = require('moment');
const balanceAccount = require('../spec/sample-docs/BalanceAccount');
const uuid = require('uuid');
const request = require('request-promise');
const token = process.env.LOGGLY_TOKEN;
const { ServiceBusClient } = require('@azure/service-bus');

exports.logEvents = async (message) => {
    var error = Object.assign({}, message);
    error.functionName = 'UserApi';
    await request.post(`${process.env.LOGGLE_URL}/inputs/${token}/tag/http/`, {
        json: true,
        body: error,
        headers: {
            'content-type': 'application/json'
        }
    });
};

exports.balanceAccounts = (merchant) => {
    const startDate = moment.utc().toDate();
    const endDate = moment.utc().add(20, 'y')
        .toDate();
    balanceAccount._id = uuid.v4();
    balanceAccount.balanceAccountName = 'Balance Account';
    balanceAccount.balanceAccountDescription = 'Balance Account created on signup';
    balanceAccount.balanceCurrency = merchant.merchantCurrency;
    balanceAccount.partitionKey = balanceAccount._id;
    balanceAccount.balanceAmount = 0;
    balanceAccount.isEnabled = true;
    balanceAccount.isDefault = true;
    balanceAccount.issuerMerchantID = merchant._id;
    balanceAccount.issuerMerchantName = merchant.merchantName;
    balanceAccount.isVirtualValue = false;
    balanceAccount.ownerID = merchant._id;
    balanceAccount.ownerType = 'merchant';
    balanceAccount.validFromDate = startDate;
    balanceAccount.validToDate = endDate;
    balanceAccount.creditLimit = 0;
    balanceAccount.creditInterestRate = 5;
    balanceAccount.createdDate = new Date();
    balanceAccount.updatedDate = new Date();
    return balanceAccount;
};

exports.sendMessageToAzureBus = async (topic, message, context) => {
    if (topic && message) {
        const serviceBusClient = new ServiceBusClient(process.env.AZURE_BUS_CONNECTION_STRING);

        const sender = serviceBusClient.createSender(topic);

        const messages = { body: message, messageId: uuid.v4() };

        try {
            await sender.sendMessages(messages);
            if (context)
                context.log('Message sent');
            return true;
        } catch (error) {
            if (context)
                context.log(error);
            return false;
        }
    }
};

exports.logInfo = async (message) => {
    var logMessage = Object.assign({}, message);
    logMessage.functionName = 'UserApi';

    await request.post(`${process.env.LOGGLE_URL}/inputs/${token}/tag/http/`, {
        json: true,
        body: logMessage,
        headers: {
            'content-type': 'application/json'
        }
    });
};

exports.makeCode = (l) => {
    var code = '';
    var digit_list = '0123456789';
    for (var i = 0; i < l; i++) {
        code += digit_list.charAt(Math.floor(Math.random() * digit_list.length));
    }
    return code;
};

exports.handleError = (context, error) => {
    context.log.error(error);
    switch (error.constructor) {
        case errors.InvalidUUIDError:
        case errors.PriceplanNotFoundError:
            this.setContextResError(context, error);
            break;
        case MongoError:
            this.handleMongoErrors(context, error);
            break;
        default:
            this.handleDefaultError(context, error);
            break;
    }
};

exports.validateUUIDField = (context, id, message = 'The user id specified in the URL does not match the UUID v4 format.') => {
    return new Promise((resolve, reject) => {
        if (validator.isUUID(id, 4)) {
            resolve();
        } else {
            reject(
                new errors.InvalidUUIDError(message, 400)
            );
        }
    });
};

/**
 *
 * @param {any} context Context object from Azure function
 * @param {BaseError} error Custom error object of type base error
 */
exports.setContextResError = (context, error) => {
    const body = {
        code: error.code,
        description: error.message,
        reasonPhrase: error.name
    };
    context.res = {
        status: error.code,
        body: body
    };
    this.logEvents(body);
};

exports.handleDefaultError = (context, error) => {
    context.log.error(error.message || error);
    this.setContextResError(
        context,
        new errors.UsersApiServerError(
            'Something went wrong. Please try again later.',
            500
        )
    );
};

exports.handleMongoErrors = (context, error) => {
    switch (error.code) {
        case 11000:
            handleDuplicateDocumentInserts(context);
            break;
        default:
            this.handleDefaultError(context, error);
            break;
    }
};
const handleDuplicateDocumentInserts = context => {
    let className, entity;

    if (context.req.body.docType === 'users') {
        className = 'DuplicateUserError';
        entity = 'user';
    }
    if (context.req.body.docType === 'userGroups') {
        className = 'DuplicateUserGroupError';
        entity = 'userGroups';
    }
    if (context.req.body.docType === 'teams') {
        className = 'DuplicateTeamError';
        entity = 'team';
    }
    
    if (context.req.body.docType === 'userWidgets') {
        className = 'DuplicateUserWidgetsError';
        entity = 'userWidgets';
    }
    
    if (context.req.body.docType === 'contacts') {
        className = 'DuplicateContactsError';
        entity = 'contacts';
    }

    this.setContextResError(
        context,
        new errors[className](
            `You've requested to create a new ${entity} but a ${entity} with the specified _id field already exists.`,
            409
        )
    );
};

exports.createStripeCustomer = (email, merchant) => {
    const stripeActivity = 'CreateStripeCustomer';
    const logMessage = {};

    return new Promise((resolve, reject) => {
        stripe.customers.create({
            email: email,
            description: merchant.merchantName,
            metadata: {
                merchantID: merchant._id // custom metadata field merchantID
            }

        }, (err, customer) => {

            if (err) {
                console.log(err);
                logMessage.reasonPhrase = err.type;
                logMessage.code = err.statusCode;
                logMessage.stripeActivity = stripeActivity;
                this.logEvents(logMessage); // logs error
                return reject(err);
            } else {
                logMessage.stripeActivity = stripeActivity;
                logMessage.message = 'Succesfully created stripe customer';
                logMessage.code = 200;
                this.logInfo(logMessage);
                return resolve(customer);
            }
        });
    });
};



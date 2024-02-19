'use strict';

const { getMongodbCollection } = require('../db/mongodb');
const utils = require('../utils');
const Promise = require('bluebird');
const errors = require('../errors');
const uuid = require('uuid');
const userDoc = require('../spec/sample-docs/Users');
const merchantDoc = require('../spec/sample-docs/Merchants');
const accountListDoc = require('../spec/sample-docs/AccountList');
const product1 = require('../spec/sample-docs/Product1');
const product2 = require('../spec/sample-docs/Product2');
const product3 = require('../spec/sample-docs/Product3');
const webShopDoc = require('../spec/sample-docs/WebshopDoc');
const bcrypt = require('bcryptjs');
const request = require('request-promise');
let customerDetail;

//Please refer bac-254, 256 for this endpoint related details

module.exports = (context, req) => {
    if (!req.body) {
        utils.setContextResError(
            context,
            new errors.EmptyRequestBodyError(
                'You have requested for signup confirmation but the request body seems to be empty.',
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

    let usersCollection;
    let userSignup;
    let merchant;
    const merchantPricePlanID = uuid.v4();
    const merchantPricePlan = {};
    return utils.validateUUIDField(context, `${req.body._id}`, 'The _id field specified in the request body does not match the UUID v4 format.')
        .then(() => getMongodbCollection('Users'))
        .then(collection => {
            usersCollection = collection;
            return collection.findOne({
                _id: req.body._id,
                docType: 'userSignup'
            });
        })
        .then(result => {
            if (result) {
                const todaysDate = new Date();
                if (todaysDate < result.signupExpiryDate) { // If the userSignup is not expired.
                    userSignup = result;
                    merchant = Object.assign(
                        {},
                        merchantDoc,
                        {
                            docType: 'merchants',
                            createdDate: new Date(),
                            updatedDate: new Date()
                        }
                    );
                    merchant._id = uuid.v4();
                    merchant.merchantName = userSignup.company;
                    merchant.isMerchantHandlingSettlement = false;
                    merchant.partitionKey = merchant._id;
                    merchant.countryCode = userSignup.country;
                }
            } else {
                utils.setContextResError(
                    context,
                    new errors.UserNotFoundError(
                        'The _id specified in the body doesn\'t exist.',
                        404
                    )
                );
            }
        })
        .then(result => {
            if (result) {
                return request.get(process.env.MERCHANT_API_URL + `/api/${process.env.MERCHANT_API_VERSION}/countries`, {
                    json: true,
                    headers: {
                        'x-functions-key': process.env.MERCHANT_API_KEY
                    }
                });
            }
        })
        .then(countrydoc => {
            if (userSignup) {
                if (countrydoc && countrydoc._id) {
                    if (countrydoc.countries && Array.isArray(countrydoc.countries)) {
                        countrydoc.countries.forEach((item) => {
                            if (item.countryCode === userSignup.country) {
                                merchant.merchantCurrency = item.currency;
                                merchant.walletCurrency = item.currency; //change currency in bac-156
                            }
                        });
                    }
                }
                return utils.createStripeCustomer(userSignup.email, merchant);
            }
        })
        .then(customerDetails => {
            if (customerDetails) {
                customerDetail = customerDetails;
                merchant.pspAccount = customerDetails.id;
                merchant.pspEmail = customerDetails.email;
                merchant.pspName = 'Stripe';
               
                return request.get(`${process.env.MERCHANT_API_URL}/api/${process.env.MERCHANT_API_VERSION}/priceplans?country=${userSignup.country}&currency=${merchant.merchantCurrency}`, { //Get price plan
                    json: true,
                    headers: {
                        'x-functions-key': process.env.MERCHANT_API_KEY
                    }
                });
            }
        })
        .then(pricePlan => {
            if (pricePlan && Array.isArray(pricePlan) && pricePlan.length) {
                merchantPricePlan._id = merchantPricePlanID;
                merchantPricePlan.docType = 'merchantPricePlan';
                merchantPricePlan.merchantID = merchant._id;
                merchantPricePlan.partitionKey = merchant._id;
                merchantPricePlan.pricePlanName = 'Basic';
                merchantPricePlan.pricePlanDescription = pricePlan[0].pricePlanDescription;
                merchantPricePlan.validFromDate = pricePlan[0].validFromDate;
                merchantPricePlan.validToDate = pricePlan[0].validToDate;
                merchantPricePlan.isEnabled = pricePlan[0].isEnabled;
                merchantPricePlan.isTrialPlan = pricePlan[0].isTrialPlan;
                merchantPricePlan.trialPeriodDays = pricePlan[0].trialPeriodDays;
                merchantPricePlan.nextStepPricePlan = pricePlan[0].nextStepPricePlan;
                merchantPricePlan.currency = pricePlan[0].currency;
                merchantPricePlan.country = pricePlan[0].country;
                merchantPricePlan.pricePlanCode = pricePlan[0].pricePlanCode;
                merchantPricePlan.languageCode = pricePlan[0].languageCode;
                merchantPricePlan.languageName = pricePlan[0].languageName;
                merchantPricePlan.fees = pricePlan[0].fees;
                merchantPricePlan.monthlySubscriptionTransactionsCounter = pricePlan[0].monthlySubscriptionTransactionsCounter;
                merchantPricePlan.monthlySubscriptionActiveVouchersCounter = pricePlan[0].monthlySubscriptionActiveVouchersCounter;
                merchantPricePlan.numberOfBusinessUnitsIncluded = pricePlan[0].numberOfBusinessUnitsIncluded;
                merchantPricePlan.numberOfUsersIncluded = pricePlan[0].numberOfUsersIncluded;
                merchantPricePlan.numberOfPartnerNetworksIncluded = pricePlan[0].numberOfPartnerNetworksIncluded;
                merchantPricePlan.numberOfWebshopsIncluded = pricePlan[0].numberOfWebshopsIncluded;
                merchantPricePlan.numberOfMobilePaymentCodesIncluded = pricePlan[0].numberOfMobilePaymentCodesIncluded;
                merchantPricePlan.numberOfProductsIncluded = pricePlan[0].numberOfProductsIncluded;
                merchantPricePlan.payoutForExpiredVouchersPercent = pricePlan[0].payoutForExpiredVouchersPercent;
                merchantPricePlan.vatPercent = pricePlan[0].vatPercent;
                merchantPricePlan.vatClass = pricePlan[0].vatClass;
                merchantPricePlan.pspPricePlanID = pricePlan[0].pspPricePlanID;
                merchantPricePlan.pspZeroValueVoucherPlanID = pricePlan[0].pspZeroValueVoucherPlanID;
                merchantPricePlan.pspMicroShopPlanID = pricePlan[0].pspMicroShopPlanID;
                merchantPricePlan.pspExpressShopPlanID = pricePlan[0].pspExpressShopPlanID;
                merchantPricePlan.pointOfServiceTypePrices = pricePlan[0].pointOfServiceTypePrices;
                merchantPricePlan.createdDate = new Date();
                merchantPricePlan.updatedDate = new Date();
                return request.post(process.env.MERCHANT_API_URL + `/api/${process.env.MERCHANT_API_VERSION}/merchant-priceplan`, {
                    json: true,
                    body: merchantPricePlan,
                    headers: {
                        'x-functions-key': process.env.MERCHANT_API_KEY
                    }
                });
            } else if (merchant) {
                context.log('price plan not exist for this country = ' + merchant.countryCode + ' and currency = ' + merchant.merchantCurrency + ', so price plan not set in merchant = ' + req.body._id);
            }
        })
        .then(result =>{
            if (customerDetail) {
                if (result) {
                    merchant.pricePlan = {
                        merchantPricePlanID: merchantPricePlanID,
                        merchantPricePlanName: 'Basic'
                    };
                }
                return request.post(process.env.MERCHANT_API_URL + `/api/${process.env.MERCHANT_API_VERSION}/merchants`, {
                    body: merchant,
                    json: true,
                    headers: {
                        'x-functions-key': process.env.MERCHANT_API_KEY
                    }
                });
            }
        })
        .then((merchantResult) => {
            if (merchantResult) {

                merchant = merchantResult;
                return usersCollection.findOne({
                    email: userSignup.email,
                    docType: 'users'
                });
            }
        })
        .then(result => {
            if (userSignup) {
                var userMerchant = {
                    merchantID: merchant._id,
                    merchantName: merchant.merchantName,
                    roles: 'admin'
                };
                if (result) { //If user  exists
                    if (result.merchants && Array.isArray(result.merchants)) {
                        result.merchants.push(userMerchant);
                    } else {
                        result.merchants = new Array(userMerchant);
                    }
                    return usersCollection.updateOne({
                        _id: result._id,
                        docType: 'users',
                        partitionKey: result._id
                    }, {
                        $set: Object.assign(
                            {},
                            result,
                            {
                                updatedDate: new Date()
                            }
                        )
                    });

                } else {
                    if (!(userDoc.hasOwnProperty('sendNotifications'))) {
                        userDoc.sendNotifications = { //set default values to false
                            viaEmail: true,
                            viaSMS: false,
                            viaPush: false,
                            onMerchantMemberRequest: false,
                            onMerchantMemberRemoval: false,
                            onProfileChanges: false,
                            onVourityNews: false,
                            onPayout: false,
                            onFailedTransaction: false,
                            onFailedPayout: false,
                            onSupportRequest: false
                        };
                    }
                    if (userDoc.consents && Array.isArray(userDoc.consents)) {
                        userDoc.consents.forEach(element => {
                            element.approvalDate = new Date();
                        });
                    }
                    if (!(userDoc.hasOwnProperty('languageCode'))) {
                        userDoc.languageCode = 'en-US';
                    }
                    if (!(userDoc.hasOwnProperty('languageName'))) {
                        userDoc.languageName = 'English';
                    }
                    const user = Object.assign(
                        {},
                        userDoc,
                        {
                            docType: 'users',
                            createdDate: new Date(),
                            updatedDate: new Date()
                        }
                    );
                    delete user.mobilePhone;// As we dont have mobilePhone information yet
                    user.email = userSignup.email;
                    user.name = userSignup.name;
                    user.loginName = userSignup.email;
                    user.merchants = new Array(userMerchant);
                    user._id = uuid.v4();
                    user.partitionKey = user._id;
                    var salt = bcrypt.genSaltSync(12);
                    var hash = bcrypt.hashSync(req.body.password, salt);
                    user.password = hash;
                    return usersCollection.insertOne(user);
                }
            }
        })
        .then(user => {
            if (user) {
                if (accountListDoc.accounts && Array.isArray(accountListDoc.accounts)) {
                    for (var i = 0; i < accountListDoc.accounts.length; i++) {
                        accountListDoc.accounts[i].currency = merchant.merchantCurrency;
                    }
                }
                if (accountListDoc.productClasses && Array.isArray(accountListDoc.productClasses)) {
                    for (var j = 0; j < accountListDoc.productClasses.length; j++) {
                        accountListDoc.productClasses[j].currency = merchant.merchantCurrency;
                    }
                }
                accountListDoc._id = uuid.v4();
                accountListDoc.docType = 'accountList';
                accountListDoc.partitionKey = merchant._id;
                accountListDoc.merchantID = merchant._id;
                accountListDoc.countryCode = merchant.countryCode;
                accountListDoc.createdDate = new Date();
                accountListDoc.updatedDate = new Date();
                return request.post(`${process.env.LEDGERS_API_URL}/api/v1/account-lists`, {
                    json: true,
                    body: accountListDoc,
                    headers: {
                        'x-functions-key': process.env.LEDGERS_API_KEY
                    }
                });
            }
        })
        .then((accountList) => {
            if (accountList) {
                var allrequest = [];
                const balanceAccountType = ['balance', 'voucher', 'cashcard', 'cashpool'];
                for (var i = 0; i < balanceAccountType.length; i++) {
                    const balanceAccount = utils.balanceAccounts(merchant);
                    balanceAccount.balanceAccountType = balanceAccountType[i];
                    allrequest.push(request.post(process.env.VOUCHER_API_URL + `/api/${process.env.VOUCHER_API_VERSION}/balance-accounts`, {
                        body: balanceAccount,
                        json: true,
                        headers: {
                            'x-functions-key': process.env.VOUCHER_API_KEY
                        }
                    }));
                }
                return Promise.all(allrequest);
            }
        })
        .then(balanceAccountResults => {
            if (balanceAccountResults && Array.isArray(balanceAccountResults)) {
                balanceAccountResults.forEach(balanceAccountResult => {
                    if (balanceAccountResult.balanceAccountType === 'cashpool') {
                        const cashpools = {
                            balanceAccountID: balanceAccountResult._id,
                            balanceAccountName: 'Cashpool 1',
                            balanceAccountDescription: balanceAccountResult.balanceAccountDescription,
                            balanceAccountType: balanceAccountResult.balanceAccountType,
                            balanceCurrency: balanceAccountResult.balanceCurrency
                        }; if (merchant.cashpools && Array.isArray(merchant.cashpools)) {
                            merchant.cashpools.push(cashpools);
                        } else {
                            merchant.cashpools = new Array(cashpools);
                        }

                    } else {
                        const balanceAccounts = {
                            balanceAccountID: balanceAccountResult._id,
                            balanceAccountName: balanceAccountResult.balanceAccountName,
                            balanceAccountDescription: balanceAccountResult.balanceAccountDescription,
                            balanceAccountType: balanceAccountResult.balanceAccountType,
                            balanceCurrency: balanceAccountResult.balanceCurrency,
                            lastPayoutTransactionID: '',
                            lastPayout: ''
                        };
                        if (merchant.balanceAccounts && Array.isArray(merchant.balanceAccounts)) {
                            merchant.balanceAccounts.push(balanceAccounts);
                        } else {
                            merchant.balanceAccounts = new Array(balanceAccounts);
                        }
                    }
                });
                return request.patch(process.env.MERCHANT_API_URL + `/api/${process.env.MERCHANT_API_VERSION}/merchants/${merchant._id}`, {
                    body: { balanceAccounts: merchant.balanceAccounts, cashpools: merchant.cashpools },
                    json: true,
                    headers: {
                        'x-functions-key': process.env.MERCHANT_API_KEY
                    }
                });
            }
        })
        .then(isUpdateMerchantDoc => {
            if (isUpdateMerchantDoc) {
                return usersCollection.deleteOne({
                    _id: userSignup._id,
                    docType: 'userSignup',
                    partitionKey: userSignup._id
                });
            }
        })
        .then(result => {
            if (result && result.deletedCount === 1) {
                product1._id = uuid.v4();
                product1.issuer.merchantID = merchant._id;
                product1.issuer.merchantName = merchant.merchantName;
                product2._id = uuid.v4();
                product2.issuer.merchantID = merchant._id;
                product2.issuer.merchantName = merchant.merchantName;
                product3._id = uuid.v4();
                product3.issuer.merchantID = merchant._id;
                product3.issuer.merchantName = merchant.merchantName;
                product1.collectorLimitationsMerchants.merchantID = merchant._id;
                product1.collectorLimitationsMerchants.merchantName = merchant.merchantName;
                product2.collectorLimitationsMerchants.merchantID = merchant._id;
                product2.collectorLimitationsMerchants.merchantName = merchant.merchantName;
                product3.collectorLimitationsMerchants.merchantID = merchant._id;
                product3.collectorLimitationsMerchants.merchantName = merchant.merchantName;
                const allProduct = [];
                allProduct.push(request.post(`${process.env.PRODUCT_API_URL}/api/${process.env.PRODUCT_API_VERSION}/products`, {
                    json: true,
                    body: product1,
                    headers: {
                        'x-functions-key': process.env.PRODUCT_API_KEY
                    }
                }));
                allProduct.push(request.post(`${process.env.PRODUCT_API_URL}/api/${process.env.PRODUCT_API_VERSION}/products`, {
                    json: true,
                    body: product2,
                    headers: {
                        'x-functions-key': process.env.PRODUCT_API_KEY
                    }
                }));
                allProduct.push(request.post(`${process.env.PRODUCT_API_URL}/api/${process.env.PRODUCT_API_VERSION}/products`, {
                    json: true,
                    body: product3,
                    headers: {
                        'x-functions-key': process.env.PRODUCT_API_KEY
                    }
                }));
                return Promise.all(allProduct);

            }
        })
        .then(result => {
            if (result && Array.isArray(result)) {
                webShopDoc._id = uuid.v4();
                webShopDoc.ownerMerchantID = merchant._id;
                webShopDoc.webShopToken = uuid.v4();
                webShopDoc.webShopContact = {};
                webShopDoc.seoMetaTitle = 'My first Micro Shop';
                webShopDoc.seoMetaDescription = 'This is a demo Micro Shop';
                if (webShopDoc.products && Array.isArray(webShopDoc.products)) {
                    for (let i = 0; i < webShopDoc.products.length; i++) {
                        webShopDoc.products[i].productID = result[i]._id;
                        webShopDoc.products[i].issuer.merchantID = merchant._id;
                        webShopDoc.products[i].issuer.merchantName = merchant.merchantName;
                    }
                }
                return request.post(`${process.env.MERCHANT_API_URL}/api/${process.env.MERCHANT_API_VERSION}/webshops`, {
                    json: true,
                    body: webShopDoc,
                    headers: {
                        'x-functions-key': process.env.MERCHANT_API_KEY
                    }
                });
            }
        })
        .then(result => {
            if (result) {
                context.res = {
                    body: {
                        code: 200,
                        description: 'Signup confirmation completed successfully.'
                    }
                };
            }
        })
        .catch(error => utils.handleError(context, error));
};

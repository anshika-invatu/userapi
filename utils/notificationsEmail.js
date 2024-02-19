const utils = require('../utils/index');
const uuid = require('uuid');
const notificationDoc = require('../spec/sample-docs/Notification');


exports.sendVerificationCodeEmail = (varificationCode, userID) => {
    return new Promise((resolve, reject) => {
        if (varificationCode) {
            notificationDoc._id = uuid.v4();
            notificationDoc.receiver = {};
            notificationDoc.receiver.userID = userID;
            notificationDoc.notificationType = 'email';
            notificationDoc.createdDate = new Date();
            notificationDoc.updatedDate = new Date();
            notificationDoc.sentDate = new Date();
            notificationDoc.messageSubject = 'Vourity Verification Code';
            notificationDoc.template = 'email-verification';
            notificationDoc.templateFields = {
                varificationCode: varificationCode
            };
            try {
                resolve(utils.sendMessageToAzureBus(process.env.AZURE_BUS_TOPIC_NOTIFICATION_EMAIL, notificationDoc));
            } catch (err) {
                console.log(err);
                reject(err);
            }
        }
    });
};

exports.vourityPasswordResetUrlEmail = (userID, url) => {
    if (userID && url) {
        notificationDoc._id = uuid.v4();
        notificationDoc.receiver = {};
        notificationDoc.receiver.userID = userID;
        notificationDoc.notificationType = 'email';
        notificationDoc.createdDate = new Date();
        notificationDoc.updatedDate = new Date();
        notificationDoc.sentDate = new Date();
        notificationDoc.template = 'reset-password-url';
        notificationDoc.templateFields = {
            url: url
        };
        notificationDoc.messageSubject = 'Vourity Password has been reset';
        try {
            utils.sendMessageToAzureBus(process.env.AZURE_BUS_TOPIC_NOTIFICATION_EMAIL, notificationDoc);
        } catch (err) {
            console.log(err);

        }
    }
};
exports.vourityPasswordResetEmail = (userID) => {
    if (userID) {
        notificationDoc._id = uuid.v4();
        notificationDoc.receiver = {};
        notificationDoc.receiver.userID = userID;
        notificationDoc.notificationType = 'email';
        notificationDoc.createdDate = new Date();
        notificationDoc.updatedDate = new Date();
        notificationDoc.sentDate = new Date();
        notificationDoc.template = 'reset-password';
        notificationDoc.messageSubject = 'Vourity Password has been reset';
        try {
            utils.sendMessageToAzureBus(process.env.AZURE_BUS_TOPIC_NOTIFICATION_EMAIL, notificationDoc);
        } catch (err) {
            console.log(err);

        }
    }
};
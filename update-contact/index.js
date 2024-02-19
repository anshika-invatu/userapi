'use strict';

const { getMongodbCollection } = require('../db/mongodb');
const utils = require('../utils');
const errors = require('../errors');


//BASE-552
module.exports = async (context, req) => {
    try {

        await utils.validateUUIDField(context, req.params.id, 'The merchant id specified in the URL does not match the UUID v4 format.');
        await utils.validateUUIDField(context, req.params.contactID, 'The contact id specified in the URL does not match the UUID v4 format.');
        const collection = await getMongodbCollection('Users');
        const contact = await collection.findOne({
            docType: 'contacts',
            _id: req.params.contactID,
            partitionKey: req.params.contactID
        });
        if (!contact) {
            utils.setContextResError(
                context,
                new errors.ContactsNotFoundError(
                    'The contact id specified in the URL doesn\'t exist.',
                    404
                )
            );
            return Promise.resolve();
        }
        if (contact && contact.merchantID !== req.params.id) {
            utils.setContextResError(
                context,
                new errors.UserNotAuthenticatedError(
                    'This merchant is not allowed to update this contact.',
                    403
                )
            );
            return Promise.resolve();
        }
        const result = await collection.updateOne({
            docType: 'contacts',
            _id: req.params.contactID,
            partitionKey: req.params.contactID,
            merchantID: req.params.id },
        { $set: Object.assign(
            {},
            req.body,
            { updatedDate: new Date() })
        });
        context.log('Update result = ' + JSON.stringify(result));
        if (result && result.matchedCount === 1) {
            context.res = {
                body: {
                    code: 200,
                    description: 'Successfully updated the specified contact'
                }
            };
        } else {
            utils.setContextResError(
                context,
                new errors.ContactsNotFoundError(
                    'The contact id specified in the URL doesn\'t exist.',
                    404
                )
            );
            return Promise.resolve();
        }
    } catch (error) {
        utils.handleError(context, error);
    }
};

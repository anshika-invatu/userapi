'use strict';

const { getMongodbCollection } = require('../db/mongodb');
const utils = require('../utils');
const errors = require('../errors');


//BASE-552
module.exports = async (context, req) => {
    try {

        await utils.validateUUIDField(context, req.params.id, 'The merchant id specified in the URL does not match the UUID v4 format.');
        const collection = await getMongodbCollection('Users');
        const contact = await collection.find({
            docType: 'contacts',
            merchantID: req.params.id
        }).toArray();
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
        
        context.res = {
            body: contact
        };
        
    } catch (error) {
        utils.handleError(context, error);
    }
};

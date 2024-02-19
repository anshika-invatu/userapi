'use strict';

const Promise = require('bluebird');
const MongoClient = require('mongodb').MongoClient;

let db;

/**
 * Get MongoDB client object
 * @returns {Promise<any>|Promise<db>}
 */
exports.getMongodbCollection = name => {
    if (db) {
        return Promise.resolve(db.collection(name));
    } else {
        return MongoClient
            .connect(process.env.MONGODB_URL, {
                promiseLibrary: Promise
            })
            .then(client => {
                db = client.db(process.env.MONGODB_DB);
                return db.collection(name);
            });
    }
};

'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { getMongodbCollection } = require('../../db/mongodb');
const existingUserDocs = [];
const existingPricePlansDocs = [];
const existingMerchantsDocs = [];
const existingCountriesDocs = [];
const existingBuisnessUnitsDocs = [];

chai.use(chaiAsPromised);

exports.API_URL = process.env.FUNCTION_STAGING_URL || 'http://localhost:7071';

exports.saveExistingDocuments = async collectionName => {
    existingUserDocs.length = 0;
    const collection = await getMongodbCollection(collectionName);
    const result = await collection.find({ docType: 'users' }).toArray();
  
    existingUserDocs.push(...result);

   
    await collection.remove({ docType: 'users' });
   
};

exports.saveExistingMerchantDocuments = async () => {
    existingPricePlansDocs.length = 0;
    existingMerchantsDocs.length = 0;
    existingCountriesDocs.length = 0;
    existingBuisnessUnitsDocs.length = 0;

    const collection = await getMongodbCollection('Merchants');

    const pricePlanArray = await collection.find({ docType: 'pricePlan' }).toArray();
    const countryArray = await collection.find({ docType: 'countries' }).toArray();
    const merchantArray = await collection.find({ docType: 'merchants' }).toArray();
    const businessUnitsArray = await collection.find({ docType: 'businessUnits' }).toArray();
    
    existingPricePlansDocs.push(...pricePlanArray);
    existingMerchantsDocs.push(...merchantArray);
    existingCountriesDocs.push(...countryArray);
    existingBuisnessUnitsDocs.push(...businessUnitsArray);


    await collection.remove({ docType: 'pricePlan' });
    await collection.remove({ docType: 'countries' });
    await collection.remove({ docType: 'merchants' });
    await collection.remove({ docType: 'businessUnits' });

};

exports.restoreExistingMerchantDocuments = async () => {
    const collection = await getMongodbCollection('Merchants');

    await collection.remove({ docType: 'pricePlan' });
    await collection.remove({ docType: 'countries' });
    await collection.remove({ docType: 'merchants' });
    await collection.remove({ docType: 'businessUnits' });


    if (existingPricePlansDocs.length) {
        await collection.insertMany(existingPricePlansDocs);
    }

    if (existingMerchantsDocs.length) {
        await collection.insertMany(existingMerchantsDocs);
    }

    if (existingCountriesDocs.length) {
        await collection.insertMany(existingCountriesDocs);
    }

    if (existingBuisnessUnitsDocs.length) {
        await collection.insertMany(existingBuisnessUnitsDocs);
    }

};

exports.restoreExistingDocuments = async collectionName => {
    const collection = await getMongodbCollection(collectionName);
    await collection.deleteMany({
        docType: {
            $in: ['users']
        }
    });
    await collection.remove({ docType: 'userSignup' });

    if (existingUserDocs.length) {
        await collection.insertMany(existingUserDocs);
    }

};

exports.createTestDocuments = async (collectionName, document) => {
    const collection = await getMongodbCollection(collectionName);
    await collection.insertOne(document);
};

exports.removeTestDocuments = async collectionName => {
    const collection = await getMongodbCollection(collectionName);
    await collection.deleteMany({
        docType: {
            $in: ['users']
        }
    });
};
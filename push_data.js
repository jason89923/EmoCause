const { MongoClient } = require('mongodb');
const ini = require('ini');
const fs = require('fs').promises;  // 使用 promise 版本的 fs
const ofs = require('fs');

const config = ini.parse(ofs.readFileSync('./config.ini', 'utf-8'));

const mongoUri = config.Database.url;
const dbName = config.Database.db;
const topicCollectionName = config.Database.topicCollection;
const topicDataset = config.Database.topicDataset;
const client = new MongoClient(mongoUri);

async function upload(fileName, collection) {
    try {
        const data = await fs.readFile(fileName, 'utf8');
        const jsonData = JSON.parse(data);
        for (const item of jsonData) {
            await collection.insertOne(Object.assign({}, item, {label: []}));
        }
    } catch (err) {
        console.error(err);
    }
}

async function run() {
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(topicCollectionName);

        const docs = await collection.find({}).toArray();
        if (docs.length > 0) {
            console.log('Collection already exists');
        } else {
            await upload(topicDataset, collection);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

module.exports = {
    run
};
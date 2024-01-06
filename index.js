const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();
const cors = require('cors');

// 啟用所有 CORS 請求
app.use(cors());

const port = 3000;

// MongoDB 連接設定
const mongoUri = 'mongodb://192.168.100.139:27017';
const dbName = 'db';
const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

// 設定靜態文件目錄
app.use(express.static('public'));

// 解析 JSON 請求體
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

// POST 請求處理路由
app.post('/submit', async (req, res) => {
    try {
        await client.connect();
        const database = client.db(dbName);
        const collection = database.collection('collection');
        const result = await collection.insertOne(req.body);
        res.status(201).send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    } finally {
        await client.close();
    }
});

app.listen(port, () => {
    console.log(`伺服器運行在 http://localhost:${port}`);
});

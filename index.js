const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();
const cors = require('cors');
const fs = require('fs');
const ini = require('ini');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// 讀取配置文件
const config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));

// 設定伺服器埠號
const port = config.Server.port;

// 設定 MongoDB 連線資訊
const mongoUri = config.Database.url;
const dbName = config.Database.db;
const collectionName = config.Database.collection;
const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });


// 啟用所有 CORS 請求
app.use(cors());

// 設定 session 和初始化 passport
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// 設定靜態文件目錄
app.use(express.static('public'));

// 解析 JSON 請求體
app.use(express.json());

// 設定 Google 認證策略
passport.use(new GoogleStrategy({
    clientID: config.Google.clientID,
    clientSecret: config.Google.clientSecret,
    callbackURL: config.Web.url
},
    function (accessToken, refreshToken, profile, cb) {
        // 在這裡，您可以基於 Google 提供的 profile 資訊來處理用戶登入或註冊邏輯
        return cb(null, profile);
    }
));


function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/auth/google'); // 未登入時重定向到 Google 登入
}

// 認證路徑
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // 成功認證，重定向首頁。
        res.redirect('/');
    });



app.get('/', ensureAuthenticated, (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

// POST 請求處理路由
app.post('/submit', async (req, res) => {
    try {
        await client.connect();
        const database = client.db(dbName);
        const collection = database.collection(collectionName);
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

const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const ini = require('ini');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const users = {}

passport.serializeUser((user, done) => {
    return done(null, user.sub)
})
passport.deserializeUser((userId, done) => {
    const user = users[userId]
    return done(null, user)
})


// 讀取配置文件
const config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));

// 設定伺服器埠號
const port = config.Server.port;

// 設定外部網址
const appUrl = config.Web.url;

// 設定 MongoDB 連線資訊
const mongoUri = config.Database.url;
const dbName = config.Database.db;
const collectionName = config.Database.collection;
const loginCollectionName = config.Database.loginCollection;
const client = new MongoClient(mongoUri);

// 設置 EJS 為模板引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


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
    callbackURL: config.Web.url + "/auth/google/callback"
},
    async function (accessToken, refreshToken, profile, cb) {
        // profile._json內存放妳向google要的使用者資料
        if (profile._json) {
            const id = profile._json.sub
            users[id] = profile._json
            
            // 連線到mongodb
            const collection = client.db(dbName).collection(loginCollectionName);
            
            // 如果使用者不存在，則新增使用者
            try {
                const user = await collection.findOne({ sub: id });
                console.log(user);
                if (!user) {
                    const res = await collection.insertOne(profile._json);
                    console.log("1 document inserted");
                }
            } catch (err) {
                throw err;
            }

            //使用者資料存在req內，回傳到後面
            return cb(null, users[id])
        }
        //失敗回傳false
        return cb(null, false)
    }
));


function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login'); // 未登入時重定向到 Google 登入
}

// 認證路徑
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

//登入成功
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // 成功認證，重定向首頁。
        res.redirect('/');
    });



app.get('/login', (req, res) => {
    res.render('login', { appUrl: appUrl });
});

app.get('/', ensureAuthenticated, (req, res) => {
    const user_id = req.user.id;
    res.render('index', { user_sub: req.user.sub, user_name: req.user.name, picture: req.user.picture, user_email: req.user.email, url:appUrl });   
});

// POST 請求處理路由
app.post('/submit', async (req, res) => {
    try {
        const database = client.db(dbName);
        const collection = database.collection(collectionName);
        const result = await collection.insertOne(req.body);
        res.status(201).send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});

app.listen(port, () => {
    console.log(`伺服器運行在 http://localhost:${port}`);
    console.log(`外部網址為 ${appUrl}`);
});

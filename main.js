const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const ini = require('ini');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const prepare = require('./push_data.js');

async function main() {
    await prepare.run();
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
    const loginCollection = config.Database.loginCollection;
    const userCollection = config.Database.userCollection;
    const topicCollection = config.Database.topicCollection;
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

                const collection = client.db(dbName).collection(loginCollection);

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
            // 已經登入
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
        res.render('index', { user_sub: req.user.sub, user_name: req.user.name, picture: req.user.picture, user_email: req.user.email, url: appUrl });
    });

    app.post('/API/nextPage', ensureAuthenticated, async (req, res) => {
        // 總頁數、下一頁題目內容
        // 確認使用者是否存在
        const user_id = req.body.uuid;
        const record = req.body.selections;



        const user_collection = client.db(dbName).collection(userCollection);
        const topic_collection = client.db(dbName).collection(topicCollection);

        const total_page = (await topic_collection.find({}).toArray()).length;
        let current_user = (await user_collection.findOne({ sub: user_id }));
        // 如果找不到使用者，則將使用者新增至資料庫，並將 current_page 設為 1
        if (!current_user) {
            await user_collection.insertOne({ sub: user_id, current_page: 1, history: [] });
        }

        current_user = (await user_collection.findOne({ sub: user_id }));
        var current_page = current_user.current_page;
        if (record === undefined) {
            if (current_user.history.length === 0) {
                var new_page = (await topic_collection.aggregate([
                    {
                      $match: { doc_id: { $nin: current_user.history } }
                    },
                    {
                      $addFields: {
                        labelSize: { $size: "$label" }
                      }
                    },
                    {
                      $sort: { labelSize: 1, doc_id: 1 }
                    },
                    {
                      $limit: 1
                    }
                  ]).toArray())[0];
                await user_collection.updateOne({ sub: user_id }, { $push: { history: new_page.doc_id }, $set: { current_page: current_page } });
            } else {
                var new_page = await topic_collection.findOne({ doc_id: current_user.history[current_page - 1] });
            }
        }
        else {
            await topic_collection.updateOne({ doc_id: current_user.history[current_page - 1] }, { $push: { label: {sub: user_id, selections: record} } });
            current_page = current_user.current_page + 1;
            var new_page = (await topic_collection.aggregate([
                {
                  $match: { doc_id: { $nin: current_user.history } }
                },
                {
                  $addFields: {
                    labelSize: { $size: "$label" }
                  }
                },
                {
                  $sort: { labelSize: 1, doc_id: 1 }
                },
                {
                  $limit: 1
                }
              ]).toArray())[0];
            await user_collection.updateOne({ sub: user_id }, { $push: { history: new_page.doc_id }, $set: { current_page: current_page } });
        }

        // 回傳current_page、total_page、題目內容
        res.json({ current_page: current_page, total_page: total_page, docs: new_page });
    });

    app.listen(port, () => {
        console.log(`伺服器運行在 http://localhost:${port}`);
        console.log(`外部網址為 ${appUrl}`);
    });
}

main();
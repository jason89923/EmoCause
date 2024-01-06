const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: "152204430465-bi0ejeisbsst1jcqmvjig0sefha2jauf.apps.googleusercontent.com",
    clientSecret: "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",
    callbackURL: "http://yourdomain.com/auth/google/callback"
},
    function (accessToken, refreshToken, profile, cb) {
        // 在這裡，您可以基於 Google 提供的 profile 資訊來處理用戶登入或註冊邏輯
        return cb(null, profile);
    }
));

const app = express();

// 設定 session 和初始化 passport
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// 設定路由
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // 成功認證，重定向首頁。
        res.redirect('/');
    });

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

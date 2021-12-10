//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const saltRounds = 10;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const findOrCreate = require('mongoose-findorcreate');
const app = express();
require('dotenv').config()
app.set("view engine", "ejs");
// app.set("trust proxy", 1);
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(session({
  secret: "I like SayoiKona she is brand new relive.",
  resave: false,
  saveUninitialized: true,
  cookie: {}
}));
app.use(passport.initialize());
app.use(passport.session());
console.log(process.env.API_KEY);
mongoose.connect("mongodb://localhost:27017/userDB");
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  facebookId: String
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
// this convvenience encryption method in mongoose-encryption will automatically.
// encrypt when you save the data and dencryption during find.
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields:["password"]});

const User = mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res) {
  res.render("home");
});
app.get("/auth/google",
  passport.authenticate("google", {
    scope: ['profile']
  }));

app.get('/auth/google/secrets',
  passport.authenticate('google', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });

app.get('/auth/facebook',passport.authenticate('facebook'));
app.get("/login", function(req, res) {
  res.render("login");
});
app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });
app.get("/register", function(req, res) {
  res.render("register");
});
app.get("/secrets", function(req, res) {
  if (req.isAuthenticated()) { //this methos comes from passport
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
})
app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});
app.post("/register", function(req, res) {
  //this method comes from passport-local-mongoose
  User.register({
    username: req.body.username,
    active: false
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/login", function(req, res) {
  const newUser = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(newUser, function(err) {
    if (err) {
      console.log(err);
      res.redirect("/login");
    } else {
      res.redirect("/secrets");
    }
  });
});
app.listen(3000, function() {
  console.log("The server is hosted on port 3000");
});

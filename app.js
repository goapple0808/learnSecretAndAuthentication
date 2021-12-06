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
  password: String
});
userSchema.plugin(passportLocalMongoose);
// this convvenience encryption method in mongoose-encryption will automatically.
// encrypt when you save the data and dencryption during find.
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields:["password"]});

const User = mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res) {
  res.render("home");
});
app.get("/login", function(req, res) {
  res.render("login");
});
app.get("/register", function(req, res) {
  res.render("register");
});
app.get("/secrets", function(req, res){
  if(req.isAuthenticated()){//this methos comes from passport
    res.render("secrets");
  }else{
    res.redirect("/login");
  }
})
app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});
app.post("/register", function(req, res) {
  //this method comes from passport-local-mongoose
  User.register({username:req.body.username, active: false}, req.body.password, function(err, user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req, res, function(){
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
  req.login(newUser, function(err){
    if(err){
      console.log(err);
      res.redirect("/login");
    } else{
      res.redirect("/secrets");
    }
  });
});
app.listen(3000, function() {
  console.log("The server is hosted on port 3000");
});

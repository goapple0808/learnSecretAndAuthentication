//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const app = express();
require('dotenv').config()
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true
}));
console.log(process.env.API_KEY);
mongoose.connect("mongodb://localhost:27017/userDB");
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});
// this convvenience encryption method in mongoose-encryption will automatically.
// encrypt when you save the data and dencryption during find.
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields:["password"]});

const User = mongoose.model("User", userSchema);

app.get("/", function(req, res) {
  res.render("home");
});
app.get("/login", function(req, res) {
  res.render("login");
});
app.get("/register", function(req, res) {
  res.render("register");
});
app.post("/register", function(req, res) {
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    let newUser = new User({
      email: req.body.username,
      password: hash
    });
    newUser.save(function(err) {
      if (err) {
        console.log(err);
      } else {
        res.render("secrets");
      }
    });
  });
});

app.post("/login", function(req, res) {
  User.findOne({
      email: req.body.username
    }, function(err, match) {
      if (err) {
        console.log(err);
      } else if (match) {
        bcrypt.compare(req.body.password, match.password, function(err, result) {
          if (err) {
            console.log(err);
          } else {
            res.render("secrets");
          }
        });
      }
  });
});
app.listen(3000, function() {
  console.log("The server is hosted on port 3000");
});

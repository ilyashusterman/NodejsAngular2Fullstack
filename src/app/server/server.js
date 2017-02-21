/**
 * Created by Ilya shusterman on 1/29/2017.
 */
var express = require('express');
var path = require('path');
var morgan = require('morgan'); // logger
var bodyParser = require('body-parser');
var session = require('express-session');
var app = express();
app.set('port', (process.env.PORT || 3000));

app.use('/', express.static(__dirname + './../../../dist'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(morgan('dev'));
app.use(session({
  secret: 'keyboard cat',
  user: '',
  maxAge: 3600000,
  saveUninitialized: true
}));

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/test');
var db = mongoose.connection;
mongoose.Promise = global.Promise;

// Models
var User = require('./user.model.js');

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log('Connected to MongoDB');

    // APIs
    // select all
    app.get('/users', function(req, res) {
        User.find({}, function(err, docs) {
            if(err) return console.error(err);
            res.json(docs);
        });
    });

    // count all
    app.get('/users/count', function(req, res) {
        User.count(function(err, count) {
            if(err) return console.error(err);
            res.json(count);
        });
    });

    // create
    app.post('/login', function(req, res) {
        var user = new User(req.body);
        //console.log(user);
       // console.log('username is '+user.username+' pass '+user.password);
        User.findOne({ username: user.username, password: user.password }, function (err, userFound) {

        if (err){
          console.log('error msg ' +err.message);
          return res.status(500).json(err.message);
        }

        if (userFound&& userFound != "") {
         // console.log("User FOUND "+ userFound);
          var newuser = {id: userFound._id, username: userFound.username, permissions: userFound.permissions };
          req.session.user = newuser;
          console.log(req.session.user);
         return res.status(200).json('User logged in successfully');
        } else {
          console.log("User NOT FOUND");
          return res.status(401).json('User not authorized');
        }
      });
    });

  app.post('/users', function(req, res) {
    var obj = new User(req.body);
    obj.save(function(err, obj) {
      if(err) return res.status(500).json(err.message);
      res.status(200).json(obj);
    });
  });

    // find by id
    app.get('/user/:id', function(req, res) {
        User.findOne({_id: req.params.id}, function(err, obj) {
            if(err) return res.status(500).json(err.message);
            res.json(obj);
        })
    });

    // update by id
    app.put('/user/:id', function(req, res) {
        User.findOneAndUpdate({_id: req.params.id}, req.body, function(err) {
            if(err) return console.error(err);
            res.sendStatus(200);
        })
    });

    // delete by id
    app.delete('/user/:id', function(req, res) {
        User.findOneAndRemove({_id: req.params.id}, function(err) {
            if(err) return console.error(err);
            res.sendStatus(200);
        });
    });


    // all other routes are handled by Angular
    app.get('/*', function(req, res) {
        res.sendFile(path.join(__dirname,'./../../../dist/index.html'));
    });

    app.listen(app.get('port'), function() {
        console.log('Angular 2 Full Stack listening on port '+app.get('port'));
    });
});

module.exports = app;

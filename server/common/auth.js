"use strict";

var passport = require('passport'),
    settings = require('../config/settings'),
    relative_urls = require('../config/urls'),
    urls_constructor = require('./urls_constructor'),
    User = require('./models/user'),
    PersonaStrategy = require('passport-persona').Strategy;

var urls = urls_constructor(settings.base_url, relative_urls);

function configure() {

    passport.use(new PersonaStrategy({
        audience: 'http://localhost:2424'
      },
      function(email, done) {
          User.findOrCreate({ email: email }, function (err, user) {
             return done(err, user);
          });
      }
    ));

    passport.serializeUser(function(user, done) {
        done(null, user);
    });

    passport.deserializeUser(function(obj, done) {
        done(null, obj);
    });
}

function checkAuthenticated(req, res, next) {
    next();
}

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    req.session.redirectUrl = req.url;
    res.redirect(urls.persona.login);
}

module.exports.ensureAuthenticated = ensureAuthenticated;
module.exports.checkAuthenticated = checkAuthenticated;
module.exports.configure = configure;

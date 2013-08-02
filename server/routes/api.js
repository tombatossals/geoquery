"use strict";

var User      = require('../common/models/user'),
    fs        = require('fs'),
    ensureAuthenticated = require('../common/google_auth').ensureAuthenticated,
    checkAuthenticated = require('../common/google_auth').checkAuthenticated;

module.exports = function(app, urls) {

    app.put(urls.api.user, ensureAuthenticated, function(req, res) {
        var phone = req.body.phone;
        var pushover = req.body.pushover;

        var query = new Object();
        query["email"] = req.user.email;

        User.findOne(query, function(err, user) {
            if (err) throw err;
            user.phone = phone;
            user.pushover = pushover;
            user.save(function() {
                return res.json(user);
            });
        });
    });

    app.get(urls.api.user, ensureAuthenticated, function(req, res) {
        var query = new Object();
        query["email"] = req.user.email;

        User.findOne(query, function(err, user) {
            if (err) throw err;
            return res.json(user);
        });
    });

};

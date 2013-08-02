"use strict";

var util = require("util"),
    fs = require("fs"),
    ensureAuthenticated = require('../common/google_auth').ensureAuthenticated;

module.exports = function(app, urls) {

    if (urls.base !== "/") {
        app.get("/", function(req, res) {
            res.redirect(urls.base);
        });
    }

    app.get(urls.user, ensureAuthenticated, function(req, res) {
        var title = "User account management";
        res.render("user", {
            controller: "UserController",
            user: req.user,
            title: title
        });
    });

    app.get(urls.base, function(req, res) {
        var title = "Troncal de la plana";
        res.render("main", {
            controller: "MapController",
            user: req.user,
            title: title
        });
    });

};

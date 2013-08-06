"use strict";

var util = require("util"),
    fs = require("fs"),
    ensureAuthenticated = require('../common/auth').ensureAuthenticated;

module.exports = function(app, urls) {

    if (urls.base !== "/") {
        app.get("/", function(req, res) {
            res.redirect("/index.html");
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

};

"use strict";

var User      = require('../common/models/user'),
    fs        = require('fs'),
    ensureAuthenticated = require('../common/auth').ensureAuthenticated,
    checkAuthenticated = require('../common/auth').checkAuthenticated,
    getCountriesByMap = require('../common/countries').getCountriesByMap,
    config = require("../config/countries.json");

module.exports = function(app, urls) {

    app.put(urls.api.response, checkAuthenticated, function(req, res) {
        var countryCode = req.body.code;

        res.json({ status: "ok", code: countryCode });
    });

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

    app.get(urls.api.countries.geojson, function(req, res) {
        var map = req.params.map;
        var f = require("../common/json/world.geo.json").features;
        var codes = getCountriesByMap(map);
        var features = [];
        for (var i in f) {
            var region = f[i];
            if (codes.indexOf(region.id) !== -1) {
                features.push(region);
            }
        }
        res.send(JSON.stringify( { type: "FeatureCollection", features: features }));
    });

    app.get(urls.api.countries.data, function(req, res) {
        var map = req.params.map;
        var f = require("../common/json/world.data.json");
        var json = [];

        if (map === "africa") {
            for (var i in f) {
                var region = f[i];
                if (region["region-code"] === "002") {
                    json.push(region);
                }
            }
            res.send(JSON.stringify(json));

        } else {
            res.send(JSON.stringify(f));
        }
    });

    app.get(urls.api.countries.config, function(req, res) {
        var map = req.params.map;
        res.send(JSON.stringify(config[map]));
    });
};

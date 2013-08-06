"use strict";

var config = require("../config/countries.json");

function getCountriesByMap(map) {
    var f = require("../common/json/world.data.json");
    var g = require("../common/json/world.geo.json").features;
    var code;

    var code = config[map].code;
    var countries = [];
    for (var i in f) {
        var region = f[i];
        if (map === "world" || region["region-code"] === code) {
            for (var j in g) {
                var geo = g[j];
                if (geo.id === region["alpha-3"]) {
                    countries.push(region["alpha-3"]);
                }
            }
        }
    }
    return countries
}

module.exports.getCountriesByMap = getCountriesByMap;

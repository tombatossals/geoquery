"use strict";

var http = require('http'),
    countries = require('./json/countries.json'),
    io = require('socket.io');

var socketio = function() {};

function sendCountry(socket) {
    var rand = countries[Math.floor(Math.random() * countries.length)];
    countries.splice(countries.indexOf(rand), 1);
    if (rand) {
        socket.emit("country", { alpha3: rand['alpha-3'], alpha2: rand['alpha-2'], name: rand['name']});
    }
    setTimeout(function() { sendCountry(socket) }, 5000);
}

socketio.prototype = {
    createServer: function(app, server_port) {
        var server = http.createServer(app);
        var io_server = io.listen(server);
        server.listen(server_port);

        io_server.sockets.on('connection', function(socket) {
            var country = "ESP";
            sendCountry(socket);
        });
    }
};

module.exports = new socketio();

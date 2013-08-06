"use strict";

var http = require('http'),
    util = require('util'),
    io = require('socket.io'),
    express = require('express'),
    config = require('../config/countries'),
    getCountriesByMap = require('./countries').getCountriesByMap,
    board = initBoard();

function initBoard() {
    var board = {}
    for (var map in config) {
        var regions = getCountriesByMap(map);
        var left = regions.slice(0);
        board[map] = { regions: regions, left: left, out: [], players: [] };
    }
    return board;
}

function broadcastOneMoreRegion(socket, map) {

    var left = board[map].left;
    var reset = false;

    if (board[map].players.length === 0) {
        return;
    }

    if (left.length === 0) {
        board[map].left = board[map].regions.slice(0);
        board[map].out = [];
        left = board[map].left;
        reset = true;
    }

    var next = left[Math.floor(Math.random() * left.length)];
    left.splice(left.indexOf(next), 1);
    board[map].out.push(next);

    if (next) {
        var numberOfPlayers = board[map].players.length;
        for (var i in board[map].players) {
            var s = board[map].players[i];
            s.emit("next", {
                next: next,
                left: left.length,
                reset: reset,
                players: numberOfPlayers
            });
        }
    }

    setTimeout(function() { broadcastOneMoreRegion(socket, map) }, 1000);
}

var socketio = function() {};

socketio.prototype = {
    createServer: function(app, server_port) {
        var server = http.createServer(app);
        var io_server = io.listen(server);
        server.listen(server_port);
        io_server.set('log level', 2);
        io_server.set('transports', [ 'jsonp-polling' ]);

        io_server.of("/europe").on('connection', function (socket) {
            board["europe"].players.push(socket);
            socket.on("init", function(map) {
                socket.emit("initresponse", { out: board[map].out });
                if (board[map].players.length === 1) {
                    broadcastOneMoreRegion(socket, map);
                }
            });
        });
    }
};

module.exports = new socketio();

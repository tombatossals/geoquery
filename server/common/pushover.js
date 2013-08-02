var push = require( 'pushover-notifications' ),
    settings = require("../config/settings"),
    User = require('./models/user');

function push_message(email, message, title, decrementa, cb, result) {
    User.findOne({ email: [ email ]}, function( err, user) {
        var p = new push( {
            user: user.pushover,
            token: settings.PUSHOVER_APPKEY
        });

        var msg = {
            message: message,
            title: title
        };

        p.send(msg, function(err, result) {
            if (err) {
                throw err;
            } else {
                decrementa(cb, result);
            }
        });
    });
}

function sendpush(result, enlace, cb) {
    var s1 = enlace.supernodos[0].name;
    var s2 = enlace.supernodos[1].name;
    var message = "Enlace: " + s1 + "-" + s2 + ", ancho de banda: " + result.bandwidth;
    var title = s1 + "-" + s2;
    var subs = enlace.subscriptions;

    var count = subs.length;

    function decrementa(cb, result) {
        count = count-1;
        if (count == 0) {
            cb(result);
        }
    }

    if (count > 0) {
        for (var i=0; i< subs.length; i++) {
            var email = subs[i].email;
            var bandwidth = subs[i].bandwidth;
            //sendpush(email, message, title, cb);
            if (result.bandwidth <= bandwidth || result.bandwidth_tx <= bandwidth || result.bandwidth_rx <= bandwidth) {
                push_message(email, message, title, decrementa, cb, result);
            } else {
                decrementa(cb, result);
            }
        }
    } else {
        cb(result);
    }
}

module.exports.sendpush = sendpush;

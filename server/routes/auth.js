"use strict";

var passport = require("passport");

module.exports = function(app, urls) {

    // PERSONA
    app.post(urls.persona.logout, function(req, res){
        req.logout();
        res.send( { status: "okay" } );
    });

    function isAuthorized(req) {
        var email;

        if (req.session && req.session.passport && req.session.passport.user && req.session.passport.user.email ) {
            email = req.session.passport.user.email[0]
        }
        var authorized = false;

        // todo: verify in DB
        if (email) {
            authorized = true;
        }
        req.session.authorized = authorized;

        return { email: email, authorized: authorized };
    }

    app.get(urls.persona.login, function(req, res) {
        res.render("main", isAuthorized(req));
    });

    app.post(urls.persona.status, function(req, res) {
        res.json(isAuthorized(req));
    });

    app.post(urls.persona.verify,
        passport.authenticate('persona', { failureRedirect: urls.login }),
        function(req, res) {
            var email;
            if (req.user.email instanceof Array) {
                email = req.user.email[0];
            } else {
                email = req.user.email;
            }

            res.json({ status: "okay", email: email });
        }
    );

};

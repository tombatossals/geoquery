/* Persona Express AngularJS module
 * ------------------------------------------------------------------
 * This is glue for the following:
 * Node             http://nodejs.org
 * Express          http://expressjs.com/
 * AngularJS        http://angularjs.org
 * Mozilla Persona  http://www.mozilla.org/en-US/persona/
 * express-persona  http://jbuck.github.com/express-persona/

 * This program is free software. It comes without any warranty, to
 * the extent permitted by applicable law. You can redistribute it
 * and/or modify it under the terms of the Do What The F*** You Want
 * To Public License, Version 2, as published by Sam Hocevar. See
 * http://sam.zoy.org/wtfpl/COPYING for more details.

 * Please don't sue: Barnabas Kendall (barnabas.kendall@gmail.com)
 *
 * This library assumes express-persona default routes,
 * persona/verify and persona/logout.
 * In addition to these, your app should expose another route:
 * persona/status, which should return
 *      {email: "me@example.com"}
 * if verified or
 *      {email: false}
 * if not verified.
  */

angular.module("geoapp.persona", []).factory("personaSvc", ["$http", "$q", function ($http, $q) {

  return {
        verify:function () {
            var deferred = $q.defer();
            navigator.id.get(function (assertion) {
                $http.post("/persona/verify", {assertion:assertion})
                    .then(function (response) {
                        if (response.data.status != "okay") {
                            deferred.reject(response.data.reason);
                        } else {
                            deferred.resolve(response.data.email);
                        }
                    });
            });
            return deferred.promise;
        },
        logout:function () {
            return $http.post("/persona/logout").then(function (response) {
                if (response.data.status != "okay") {
                    $q.reject(response.data.reason);
                }
                return response.data.email;
            });
        },
        status:function () {
            return $http.post("/persona/status").then(function (response) {
                return response.data;
            });
        }
    };
}]);

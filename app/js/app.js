(function() {
    var app = angular.module("geoapp", ["geoapp.persona", "leaflet-directive"])
                .config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
                    $routeProvider
                        .when('/:map', {});
        } ]);

    app.controller("GeoqueryController", [ "$scope", "$http", "$timeout", "$location", "$route", "$routeParams", "personaSvc", function($scope, $http, $timeout, $location, $route, $routeParams, personaSvc) {

        angular.extend($scope, {
            leaflet: {},
            good: [],
            bad: [],
            score: 0,
            countdown: undefined,
            verified:false,
            error:false,
            email: "",
            center: {
                lat: 40.09,
                lng: -3.82,
                zoom: 2
            },
            minZoom: 2,
            maxZoom: 5,
            maxBounds: {}
        });

        var canvas = document.getElementById("countdown");

        $scope.$on(
            "$routeChangeSuccess",
            function(){
                $scope.map = $routeParams.map;
                loadMap($scope.map);
            }
        );

        // Get a country paint color from the continents array of colors
        function getColor(country) {
            if (!country || !country["region-code"]) {
                return "#FFF";
            }

            var colors = $scope.colors[country["region-code"]];
            var index = country["alpha-3"].charCodeAt(0) % colors.length ;
            return colors[index];
        }

        function style(feature) {
            return {
                fillColor: getColor($scope.countries[feature.id]),
                weight: 2,
                opacity: 1,
                color: 'white',
                dashArray: '3',
                fillOpacity: 0.9
            };
        }

        function mouseout(e) {
            if (!$scope.verified || !$scope.actual) return;
            if ($scope.out && $scope.out.indexOf(e.target.feature.id) !== -1) return;
            console.log("rest");
            $scope.testing.geojson.resetStyle(e.target);
        }

        // Mouse over function, called from the Leaflet Map Events
        function mouseover(e) {
            if (!$scope.verified) return;
            if ($scope.out && $scope.out.indexOf(e.target.feature.id) !== -1) return;
            var layer = e.target;
            layer.setStyle({
                weight: 2,
                color: '#666',
                fillColor: 'white'
            });
            layer.bringToFront();
        }

        function sendCountry(country, event) {
            if (!$scope.verified || !$scope.actual) return;
            if ($scope.out && $scope.out.indexOf(country.id) !== -1) return;
            if (country.id === $scope.actual['alpha-3']) {
                $scope.good.push($scope.actual['alpha-3']);
                $scope.out.push($scope.actual['alpha-3']);
                $scope.score++;
                deactivateCountry($scope.actual['alpha-3'], 'good');
            } else {
                $scope.bad.push($scope.actual['alpha-3']);
                $scope.out.push($scope.actual['alpha-3']);
                deactivateCountry($scope.actual['alpha-3'], 'bad');
                $scope.score--;
            }
            if ($scope.countdown) {
                $scope.countdown.destroy = true;
            }
            $scope.$apply();
        }

        function resetMap(map) {
            $scope.out = [];
            $scope.bad = [];
            $scope.good = [];
            for (var i in $scope.testing.geojson._layers) {
                var layer = $scope.testing.geojson._layers[i];
                $scope.testing.geojson.resetStyle(layer);
            }
        }

        function findVector(layers, id) {
            for (var key in layers) {
                var layer = layers[key];
                if (layer.feature.id === id) {
                    return layer;
                }
            }
            return undefined;
        }

        function deactivateCountry(code, status) {
            var color = "yellow";
            if (status === "good") {
                color = "green";
            } else if (status === "bad") {
                color = "red";
            }
            var layer = findVector($scope.testing.geojson._layers, code);
            if (layer) {
                layer.setStyle({
                    fillOpacity: 0.1,
                    weight: 0,
                    color: color,
                    fillColor: color
                });
                layer.bringToFront();
            } else {
                console.log("Can't find country", code);
            }
        }

        function loadMap(map) {
            // Get the countries data from a JSON
            $http.get("/api/map/" + $scope.map + "/config").success(function(data, status) {

                angular.extend($scope, data);
                $http.get("/api/map/" + $scope.map + "/data").success(function(data, status) {

                    // Put the countries on an associative array
                    $scope.countries = {};
                    for (var i=0; i< data.length; i++) {
                        var country = data[i];
                        $scope.countries[country['alpha-3']] = country;
                    }

                    // Get the countries geojson data from a JSON
                    $http.get("/api/map/" + $scope.map + "/geojson").success(function(data, status) {
                        angular.extend($scope, {
                            geojson: {
                                data: data,
                                style: style,
                                mouseover: mouseover,
                                mouseout: mouseout,
                                click: sendCountry
                            }
                        });

                        var socket = io.connect('http://localhost/' + map);
                        socket.on('next', function (data) {
                            if (data.reset) {
                                resetMap(map);
                            } else if ($scope.actual && $scope.good.indexOf($scope.actual['alpha-3']) === -1 && $scope.bad.indexOf($scope.actual['alpha-3']) === -1) {
                                $scope.out.push($scope.actual["alpha-3"]);
                                console.log($scope.actual["alpha-3"]);
                                deactivateCountry($scope.actual["alpha-3"]);
                            }
                            $scope.actual = $scope.countries[data.next];
                            $scope.countdown = new CountDown(canvas, 5);
                            $scope.left = data.left;
                            $scope.$apply();
                        });

                        socket.emit('init', map);
                        socket.on('initresponse', function(data) {
                            $scope.out = data.out;
                            for (var i in data.out) {
                                var country = data.out[i];
                                deactivateCountry(country);
                            }
                        });
                    });
                });
            });
        }

        // PERSONA CODE
        $scope.verify = function () {
            personaSvc.verify().then(function (email) {
                angular.extend($scope, { verified:true, error:false, email:email });
                $scope.status();
            }, function (err) {
                angular.extend($scope, { verified:false, error:err});
            });
        };

        $scope.logout = function () {
            personaSvc.logout().then(function () {
                angular.extend($scope, { verified:false, error:false});
            }, function (err) {
                $scope.error = err;
            });
        };

        $scope.status = function () {
            personaSvc.status().then(function (data) {
                // in addition to email, everything else returned by persona/status will be added to the scope
                // this could be the chance to expose data from your local DB, for example
                angular.extend($scope, data, { error:false, verified:!!data.email, email:data.email });
            }, function (err) {
                $scope.error = err;
            });
        };

        // setup; check status once on init
        $scope.status();
    } ]);
}());

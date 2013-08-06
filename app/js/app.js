(function() {
    var app = angular.module("geoapp", ["geoapp.persona", "leaflet-directive"])
                .config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
                    $routeProvider
                        .when('/:map', {});
        } ]);

    app.controller("GeoqueryController", [ "$scope", "$http", "$timeout", "$location", "$route", "$routeParams", "personaSvc", function($scope, $http, $timeout, $location, $route, $routeParams, personaSvc) {

        angular.extend($scope, {
            leaflet: {},
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
            if (!$scope.verified) return;
            $scope.testing.geojson.resetStyle(e.target);
        }

        // Mouse over function, called from the Leaflet Map Events
        function mouseover(e) {
            if (!$scope.verified) return;
            var layer = e.target;
            layer.setStyle({
                weight: 2,
                color: '#666',
                fillColor: 'white'
            });
            layer.bringToFront();
        }

        function sendCountry(country, event) {
            if (country.id === $scope.actual.alpha3) {
                console.log("good!");
            } else {
                console.log("bad!", $scope.countries[country.id].name, $scope.actual.name);
            }
        }

        function resetMap(map) {
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

        function deactivateCountry(code) {
            var layer = findVector($scope.testing.geojson._layers, code);
            if (layer) {
                layer.setStyle({
                    fillOpacity: 0,
                    weight: 0,
                    color: '#666',
                    fillColor: 'white'
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

                        $timeout(function getSeconds(){
                            $scope.countdown = 60 - new Date().getSeconds();
                            $timeout(getSeconds, 1000);
                        },1000);

                        var socket = io.connect('http://localhost/' + map);
                        socket.on('next', function (data) {
                            if (data.reset) {
                                resetMap(map);
                            }

                            if ($scope.actual) {
                                deactivateCountry($scope.actual["alpha-3"]);
                            }
                            $scope.actual = $scope.countries[data.next];
                            $scope.left = data.left;
                        });

                        socket.emit('init', map);
                        socket.on('initresponse', function(data) {
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

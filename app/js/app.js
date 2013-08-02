(function() {
    var app = angular.module("geoapp", ["geoapp.persona", "leaflet-directive"]);

    app.controller("GeoqueryController", [ "$scope", "$http", "$timeout", "personaSvc", function($scope, $http, $timeout, personaSvc) {

        var socket = io.connect('http://localhost');
        socket.on('country', function (data) {
            $scope.actual = data;
        });

        var continentProperties= {
            "009": {
                    name: 'Oceania',
                    colors: [ '#CC0066', '#993366', '#990066', '#CC3399', '#CC6699' ]
            },
            "019": {
                    name: 'America',
                    colors: [ '#006699', '#336666', '#003366', '#3399CC', '#6699CC' ]
            },
            "150": {
                    name: 'Europe',
                    colors: [ '#FF0000', '#CC3333', '#990000', '#FF3333', '#FF6666' ]
            },
            "002": {
                    name: 'Africa',
                    colors: [ '#00CC00', '#339933', '#009900', '#33FF33', '#66FF66' ]
            },
            "142": {
                    name: 'Asia',
                    colors: [ '#FFCC00', '#CC9933', '#999900', '#FFCC33', '#FFCC66' ]
            },
        };

        angular.extend($scope, {
            center: {
                lat: 40.8471,
                lng: 14.0625,
                zoom: 2
            },
            defaults: {
                minZoom: 2,
                maxZoom: 5
            },
            maxbounds: {
                southWest: {
                    lat: -136.45,
                    lng: 281.83
                },
                northEast: {
                    lat: 156.00,
                    lng: -210.00
                }
            },
            verified:false,
            error:false,
            email:""
        });

        // Get a country paint color from the continents array of colors
        function getColor(country) {
            if (!country || !country["region-code"]) {
                return "#FFF";
            }

            var colors = continentProperties[country["region-code"]].colors;
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
                fillOpacity: 0.7
            };
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

        // Get the countries data from a JSON
        $http.get("json/all.json").success(function(data, status) {
            // Put the countries on an associative array
            $scope.countries = {};
            for (var i=0; i< data.length; i++) {
                var country = data[i];
                $scope.countries[country['alpha-3']] = country;
            }

            // Get the countries geojson data from a JSON
            $http.get("json/countries.geo.json").success(function(data, status) {
                angular.extend($scope, {
                    geojson: {
                        data: data,
                        style: style,
                        mouseover: mouseover,
                        click: sendCountry
                    }
                });

                $timeout(function getSeconds(){
                    $scope.countdown = 60 - new Date().getSeconds();
                    $timeout(getSeconds, 1000);
                },1000);

            });
        });

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

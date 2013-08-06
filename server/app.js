"use strict";

var express = require('express'),
    mongoose = require('mongoose'),
    MemcachedStore = require('connect-memcached')(express),
    urls_constructor = require('./common/urls_constructor'),
    generate_mongo_url = require('./common/generate_mongo_url'),
    passport = require('passport'),
    auth = require('./common/auth'),
    relative_urls = require('./config/urls'),
    socketio = require('./common/socketio');

var app = express();

var app_settings = require('./config/settings_' + app.settings.env),
    urls = urls_constructor(app_settings.base_url, relative_urls);

app.set('port', process.env.PORT || app_settings.server_port);
auth.configure(urls.persona.verify, urls.login);

if(process.env.VCAP_SERVICES){
    var env = JSON.parse(process.env.VCAP_SERVICES);
    var mongo = env['mongodb-1.8'][0]['credentials'];
}
else{
    var mongo = app_settings.mongo;
}

var conn = generate_mongo_url(mongo);
console.log(conn);
var db = mongoose.connect(conn);
var sessionStore = new MemcachedStore();

// configure Express
app.configure(function() {
  app.set('views', __dirname + '/views');
  //app.set('view engine', 'jade');
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({
      store: sessionStore,
      secret: app_settings.cookieSecret
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.locals({ urls: urls });
  app.use(app.router);
  app.use(express.static(__dirname + '/../app'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

require('./routes')(app, urls);

socketio.createServer(app, app.get('port'));

module.exports = app;

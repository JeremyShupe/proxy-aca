//Core Module Dependencies
var http = require('http');
var https = require('https');
var fs = require('fs');
//Community Module Dependencies
var S = require('string');
var express = require('express');
var app = express();
//process.env.NODE_CONFIG_PERSIST_ON_CHANGE='N'; //turns off writing to the runtime.json file from the application while application is running, has to be before require('config') 
var config = require('config');
module.exports.config = config; //Exported so it can be used in other Node JF files
//Application Module Dependencies
var logger = require('./logger');
module.exports.logger = logger; //Export so it can be used in other Node JF files
//Routes
var routes = require('./routes'); // ./routes/index.js
var api = require('./routes/api');
//Middleware Components
var rawBody = require('./lib/middleware/rawBody');
var cache = {};
module.exports.cache = cache; //Export so it can be used in other Node JF files

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs'); //sets a default view engine but any view types (jade, ejs) can be used
app.use(express.logger('dev'));
app.use(rawBody());
app.use(app.router);
app.use(routes.notfound);
app.use(routes.error);

app.post(config.proxyaca.mountpoint, api.buildRequest());

if (config.proxyaca.ssl.on) {
	var sslOptions = {
		    key: fs.readFileSync(config.proxyaca.ssl.key),
		    cert: fs.readFileSync(config.proxyaca.ssl.cert),
		    ca: fs.readFileSync(config.proxyaca.ssl.ca),
		    requestCert: config.proxyaca.ssl.requestCert,
		    rejectUnauthorized: config.proxyaca.ssl.rejectUnauthorized 
		};

	var httpsServer = https.createServer(sslOptions, app.handle.bind(app));
	httpsServer.listen(config.proxyaca.ssl.port, config.proxyaca.hostname, function() {
		logger.info('https proxy-aca listening at: ' + JSON.stringify(httpsServer.address()));
	});
} else {
	var httpServer = http.createServer(app.handle.bind(app));
	httpServer.listen(config.proxyaca.port, config.proxyaca.hostname, function() {
		logger.info('http proxy-aca listening at: ' + JSON.stringify(httpServer.address()));
	});
}



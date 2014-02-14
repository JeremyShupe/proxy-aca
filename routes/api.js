var http = require('http');//comment this out to cause application, currently applicaiton error get returned to caller, this is bad
var https = require('https');
var url = require('url');
var uuid = require('node-uuid');
var xmldom = require('xmldom');
var domParser = xmldom.DOMParser;
var fs = require('fs');
var S = require('string');
var config = module.parent.exports.config;
var logger = require('../logger');
var getRawBody = require('raw-body');

if (config.debug.allowSslSelfSignedCerts) {
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

exports.buildRequest = function() {
		return function(request, response, next) {
			
			//Function Variables
			var requestData = request.body; //data gathered from rawBody middleware
			var uid=uuid.v1().toString();
			
			if (config.debug.on) {
				logger.info('Received Request Method:       ' + uid + ' : ' + request.method);
		    	logger.info('Received Request Headers:      ' + uid + ' : ' + JSON.stringify(request.headers));
			    logger.info('Received Request Data:         ' + uid + ' : ' + requestData);
			}
			
			var post_request = '';
			var post_options = configureOptions(request);
			
			if (config.outgoing.ssl.on) {
				post_request = https.request(post_options, getResponse(uid, response, next));
			} else {
				post_request = http.request(post_options, getResponse(uid, response, next));
			}
		    
		    post_request.write(requestData);
		    post_request.end();
		    
		    post_request.on('error', function (err) {
		        if (err.message.toString().indexOf('ECONNREFUSED') > -1 ) {
		        	//var err = new Error(config.errors.outgoingUnavailable.message);
				    err.type = config.errors.outgoingUnavailable.code;
		        } else {
		        	//var err = new Error(config.errors.internalServerError.message);
				    err.type = config.errors.internalServerError.code;
		        }
		        err.uid = uid;
			    next(err); //return here? look it up
		    });
	};
};

function getResponse(uid, response, next) {
	return function rawBody(res) {
		getRawBody(res, {
			length : res.headers['content-length'], //Only works if content-length header has been set, otherwise it's ignored
			limit : config.rawBody.limit,
			encoding : config.rawBody.encoding
    	  }, function (err, responseXML) {
    		  	if (err) {
    		  		return next(err);
    		  	}
    		  	if (config.debug.on) {
	    		  	logger.info('Received Response Status Code: ' + uid + ' : ' + res.statusCode);
			    	logger.info('Received Response Headers:     ' + uid + ' : ' + JSON.stringify(res.headers));
	    		  	logger.info('Received Response Data:        ' + uid + ' : ' + responseXML);
    		  	}
    		  	response.setHeader("content-type", "application/xml");
    		  	response.send(responseXML);
    		  	response.end();
    	  });
	};
};

function configureOptions(request) {
	
	/*
	//Use if we're going to send original options with new request, causing errors
	console.log('start request:', request.url);
	var options = url.parse(request.url);
	console.log('start request options 1:', options);
	options.headers = request.headers;
	console.log('start request options.headers:', options.headers);
	*/

	var options = {
        hostname: config.outgoing.hostname,
        path: config.outgoing.endpoint,
        method: 'POST',
        headers: {}
    };
	
	options.headers['host'] = request.headers['host'];
	options.headers['soapaction'] = request.headers['soapaction'];
	options.headers['content-type'] = request.headers['content-type'];
	options.headers['content-length'] = request.body.length;
    
	    
    if (config.outgoing.ssl.on) {
    	options.port = config.outgoing.ssl.port;
	    if (!S(config.outgoing.ssl.pfx).isEmpty()) {	
	    	if (config.debug.on) {
	    		logger.info('Outgoing request options include SSL configured with pfx');
	    	}
	    	options.pfx = fs.readFileSync(config.outgoing.ssl.pfx);			    	
	    }
	    if (!S(config.outgoing.ssl.key).isEmpty()) {
	    	if (config.debug.on) {
	    		logger.info('Outgoing request options include SSL configured with key');
	    	}
	    	options.key = fs.readFileSync(config.outgoing.ssl.key);
	    }
	    if (!S(config.outgoing.ssl.cert).isEmpty()) {
	    	if (config.debug.on) {
	    		logger.info('Outgoing request options include SSL configured with cert');
	    	}
	    	options.cert = fs.readFileSync(config.outgoing.ssl.cert);
	    }
	    options.ca = [];
	    for (var i = 0; i < config.outgoing.ssl.ca.length; i++) {
	    	if (config.debug.on) {
	    		logger.info('Outgoing request options include SSL configured with CA:', config.outgoing.ssl.ca[i]);
	    	}
	        options.ca[i] = fs.readFileSync(config.outgoing.ssl.ca[i]);
	    }
	    if (!S(config.outgoing.ssl.passphrase).isEmpty()) {	
	    	options.passphrase = config.outgoing.ssl.passphrase;
	    }
	    if (!S(config.outgoing.ssl.agent).isEmpty()) {	
	    	options.agent = config.outgoing.ssl.agent;
	    }
    } else {
    	if (config.debug.on) {
    		logger.info('Outgoing request options are NON-SSL');
    	}
    	options.port = config.outgoing.port;
    }
    
    if (config.debug.on) {
    	console.log('Outgoing request options:', options);
    }
    
	    
    return options;
}
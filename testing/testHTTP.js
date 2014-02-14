var http = require('http');
var fs = require("fs");
var S = require('string');

var post_data = S(fs.readFileSync("./testXML.xml")).toString();

//var post_data = '';
//Add headers with content type and length 
var post_options = {
	host: 'localhost',
	port: '9000',
	path: '/proxy_core/webservices/ACAEnrollmentVerificationProxy',
	method: 'POST'
};

var post_req = http.request(post_options, function(res) {
	console.log("Response Status Code: ", res.statusCode);
	console.log("Response headers: ", res.headers);
	res.setEncoding('utf8');
	res.on('data', function(data) {
    	console.log("Reponse:" + data);
  	});
});

post_req.write(post_data);
post_req.end();

post_req.on('error', function(e) {
	console.error(e);
});
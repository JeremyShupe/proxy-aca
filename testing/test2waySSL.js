var https = require('https');
var fs = require("fs");
var S = require('string');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; //Allows for self-signed certificate testing

var post_data = S(fs.readFileSync("./testXML.xml")).toString();

var post_options = {
	host: 'localhost',
	port: '9001',
	path: '/proxy_core/webservices/ACAEnrollmentVerificationProxy',
	method: 'POST',
	//pfx: fs.readFileSync('../ssl/p12s/userA.p12'),
	//passphrase: 'passme'
	key: fs.readFileSync("../ssl/keys/userA.key"), //either pfx with p12 and passphrase OR key and ca work
	cert: fs.readFileSync("../ssl/certs/userA.crt"),
	ca: fs.readFileSync("../ssl/ca/ca.crt")
};

var post_req = https.request(post_options, function(res) {
	console.log("statusCode: ", res.statusCode);
	console.log("headers: ", res.headers);
	res.setEncoding('utf8');
	res.on('data', function(d) {
    	console.log("Reponse:" + d);
  	});
});

post_req.write(post_data);
post_req.end();

post_req.on('error', function(e) {
	console.error(e);
});
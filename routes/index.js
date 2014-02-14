var xmldom = require('xmldom');
var domParser = xmldom.DOMParser;
var fs = require('fs');
var uuid = require('node-uuid');
var S = require('string');
var url = require('url');
var logger = module.parent.exports.logger;
var config = module.parent.exports.config;
var errors = config.errors;

exports.notfound = function(req, res){
	var cache = module.parent.exports.cache; 
    var uid = uuid.v1().toString();
    var pathname = url.parse(req.url).pathname;
    
    logger.error('Resource Not Found: ' + uid + ' : ' +  pathname);
  
    res.status(errors.notFound.statusCode).format({
    	xml: getErrorXmlMsg(req, res, errors.notFound.code, errors.notFound.message, uid, cache)  //if 'accept' header is not set, xml format is default
    });
};

exports.error = function(err, req, res, next){
  var cache = module.parent.exports.cache;
  var message;
  var code;
  var statusCode;
  var uid;
  
  if (S(err.uid).isEmpty()) {
	  uid = uuid.v1().toString();
  } else {
	  uid = err.uid;
  }
  
  logger.error('Error: ' + uid + ' - ' +  err.stack);

  switch (err.type) {
    case errors.outgoingUnavailable.code:  
    	message = errors.outgoingUnavailable.message; 
    	code = errors.outgoingUnavailable.code;
    	statusCode = errors.outgoingUnavailable.statusCode;
    	break;
    case errors.entityTooLarge.code:  
    	message = errors.entityTooLarge.message; 
    	code = errors.entityTooLarge.statusCode;
    	statusCode = errors.entityTooLarge.statusCode;
    	break;
    case errors.requestSizeInvalid.code:  
    	message = errors.requestSizeInvalid.message; 
    	code = errors.requestSizeInvalid.statusCode;
    	statusCode = errors.requestSizeInvalid.statusCode;
    	break;
    default:
    	message = errors.internalServerError.message; 
    	code = errors.internalServerError.code;
    	statusCode = errors.internalServerError.statusCode;
  }
  
  res.status(statusCode).format({
	  xml: getErrorXmlMsg(req, res, code, message, uid, cache)  //if 'accept' header is not set, xml format is default
  });
};

function getErrorXmlMsg(req, res, code, message, uid, cache) { 
	return function() {
		//var absPath = './' + 'errorMsg.xml';
		var absPath = errors.msgXmlPath;
		if (cache[absPath]) {
			buildAndSendErrorXmlMsg(res, req, code, message, cache[absPath], uid);
		} else {
			fs.readFile(absPath, function(err, data) {
				cache[absPath] = data;
				buildAndSendErrorXmlMsg(res, req, code, message, data, uid);
			});
		};
	};
	
};

function buildAndSendErrorXmlMsg(res, req, code, message, errorXml, uid) {
	
    //Request DOC
    var node;
    var identificationId = '';
    var replacedErrXML= '';
    var requestDoc = new domParser().parseFromString(req.body);
    if (requestDoc) { //Protects against errors when extracting the body from the request (rawbody calls), or when req.body is null
    	node = requestDoc.getElementsByTagName('ns1:IdentificationID')[0]; //Protects against instances where IdentificationID node is not found
    	if (node) {
    		identificationId = node.childNodes[0].nodeValue;
    	}
    }

    //Err DOC
    replacedErrXML = errorXml.toString().replace('<ns1:IdentificationID>?</ns1:IdentificationID>','<ns1:IdentificationID>'+identificationId+'</ns1:IdentificationID>');
    replacedErrXML = replacedErrXML.replace('<aca:ErrorCode>?</aca:ErrorCode>','<aca:ErrorCode>'+ code +'</aca:ErrorCode>');
    replacedErrXML = replacedErrXML.replace('<aca:Reason>?</aca:Reason>','<aca:Reason>'+ message +'</aca:Reason>');
    logger.debug('Error Response: ' + uid + ' : '+replacedErrXML);
    
	//res.writeHead(statuscode, {'content-type': 'application/xml'});
	res.setHeader('Content-Type', 'application/xml');
	res.end(replacedErrXML);
}


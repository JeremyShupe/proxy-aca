//Community module, suggested module by creators of Connect module 
//to use in order to pull rawbody data from a request and to limit 
//size of the content the application is willing to take in.
var getRawBody = require('raw-body');
// Pull in logger and config made available from parent module.
var logger = module.parent.exports.logger;
var config = module.parent.exports.config;

// getRawBody(stream, [options], [callback])
module.exports = function RawBody() {
	return function rawBody(req, res, next) {
		//var contentLength = req.headers['content-length']
		//logger.info('content-length: ' + contentLength);
		getRawBody(req, {
			length : req.headers['content-length'], //Only works if content-length header has been set, otherwise it's ignored
			limit : config.rawBody.limit,
			encoding : config.rawBody.encoding
		}, function(err, data) {
			if (err) {
				return next(err);
			}
			req.body = data;
			next();
		});
	};
};


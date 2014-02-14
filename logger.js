//Configure Logger for Application
var config = require('config');
var vcommons = require('vcommons');
var Log = vcommons.log;
var logger = Log.getLogger('proxy-aca', config.log );
module.exports = logger;
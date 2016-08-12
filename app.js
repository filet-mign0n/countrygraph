var config = require('config');
var redis = require('redis').createClient(config.get('redis.port'), config.get('redis.host'));
var path = require('path');
var logger = require('morgan');
var express = require('express');
var router = express.Router();
var app = express();
var args = process.argv.slice(2);
var db = require('./utils/db')
var RateLimit = require('express-rate-limit');
var RedisStore = require('rate-limit-redis');
var port = process.env.PORT || (parseInt(process.argv[2]) || 8000);
port = (typeof port === "number") ? port : 8000;

var reqLimiter = new RateLimit({
	store: new RedisStore({client: redis}),
	max: 6
});

app.set('port', port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(logger('dev'));
app.use('/', reqLimiter);
app.get('/', function(req, res) { 
	var ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	db.saveReq(ip)
	res.render('index')
});

if(!module.parent) { 
   	var server = app.listen(app.get('port'), function() {
   	        console.log('Express server listening on PORT ' + app.get('port'));
   	});
   	require('./utils/crawl_server')(server)
}

module.exports = function() {
	var server = app.listen(app.get('port'), function() {
	        console.log('Express server listening on PORT ' + app.get('port'));
	});
	require('./utils/crawl_server')(server)

	return server
}





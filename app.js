var path = require('path');
var logger = require('morgan');
var express = require('express');
var router = express.Router();
var app = express();
var args = process.argv.slice(2);
var port = process.env.PORT || (process.argv[2] || 8000);
port = (typeof port === "number") ? port : 8000;

app.set('port', port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(logger('dev'));
app.get('/', function(req, res) { res.render('index'); });

if(!module.parent) { 
   	var server = app.listen(app.get('port'), function() {
   	        console.log('Express server listening on PORT ' + app.get('port'));
   	});
   	require('./crawl_server')(server)
}

module.exports = function() {
	var server = app.listen(app.get('port'), function() {
	        console.log('Express server listening on PORT ' + app.get('port'));
	});
	require('./crawl_server')(server)

	return server
}





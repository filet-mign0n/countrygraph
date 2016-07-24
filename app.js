var path = require('path');
var logger = require('morgan');
var express = require('express');
var router = express.Router();
var app = express();

var args = process.argv.slice(2);
var port = args[0] ? args[0] : 8000

app.set('port', port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(logger('dev'));

var server = app.listen(app.get('port'), function() {
        console.log('listening on PORT ' + app.get('port'));
});

require('./crawl_server')(server)

app.get('/', function(req, res) {
	res.render('index');
});






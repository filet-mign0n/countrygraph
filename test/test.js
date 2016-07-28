const test_collection = require('./test_collection.json');
const debug = require('debug')('countrygraph');
var test_model = require('../utils/db').Country;
var test_utils = require('./test_utils');
var assert = require('chai').assert;
var server = require('../app')();
var c; //test client

/* Arguably a long testing timeout, but consider there is web  
crawling and frequency distribution calculation involved */
const test_timeout = 60000;

describe('WebSocket Client', function() {

	beforeEach(function() {
		c = test_utils.ws_client();
		c.on('connect', function() {
			debug('ws client connected');
		});

	});

	afterEach(function() {
		c.close();
	});

	after(function() {
		server.close();
		test_model.remove({}, function(err) { 
			debug('test collection removed');
		});
	});

	var Norway = test_utils.find_country_doc("Norway", test_collection)
	var Finland = test_utils.find_country_doc("Finland", test_collection)
	var Japan = test_utils.find_country_doc("Japan", test_collection)

	describe('Emits ["Norway"]', function() {

		it('should return a Norway node object with correct name and flag image url', function(done) {
			this.timeout(test_timeout)

			c.emit('c', ["Norway"])

			c.on('crawl', function(d) {
				
				debug('Assert', Norway.name, '==', d.name);
				assert.equal(Norway.name, d.name);
				debug('Assert', Norway.flag, '==', d.img);
				assert.equal(Norway.flag, d.img);
				done();
			});
    	});
  	});

  	describe('Emits ["Norway", "Finland"]', function() {

  		it('should return a link between Norway and Finland that is in both countries\' edges array', function(done) {
  			this.timeout(test_timeout)

  			c.emit('c', ["Norway", "Finland"])

  			c.on('crawl', function(d) {

  				if (d.type === "link") {
  					debug('Assert', test_utils.findEdge("Finland", Norway.edges), '==', d.dist);
  					assert.equal(test_utils.findEdge("Finland", Norway.edges), d.dist);
  					debug('Assert', test_utils.findEdge("Norway", Finland.edges), '==', d.dist);
  					assert.equal(test_utils.findEdge("Norway", Finland.edges), d.dist);
  					done();
  				}

  			});
  		});
  	});

  	//describe('Emits ["Japan", "Norway", "Finland"]' function() {

  	//	if('should ')
  	//})
});

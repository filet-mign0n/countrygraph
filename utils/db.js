const debug = require('debug')('countrygraph');
var config = require('config');
var redis = require('redis').createClient(config.get('redis.port'), config.get('redis.host'));
var mongoose = require('mongoose')
var Schema = mongoose.Schema
var Promise = require('bluebird')
var exports = module.exports
var url = 'mongodb://' + config.get('mongo.host') + ':' + config.get('mongo.port') + '/' + config.get('mongo.db')

mongoose.connect(url, function(err) {
	if (err) throw (err)
	debug("Mongoose connected to", url)
})

var h2_Schema = new Schema({ title: String, p: String }, { noId: true });
var edgeList_Schema = new Schema({ country: String, dist: Number, bg_common: Array}, { noId: true });

var Country = new Schema({
	create_date: { type: Date, default: Date.now },
	name: { type: String, required : true }, //unique: true
	url: String,
	flag: String,
	h2: [h2_Schema],
	fd_bg: Array,
	fd_uno: Array,
	edges: [edgeList_Schema],
	
	/* For future use

	h3: Array,
	latlong: {
		url: String, 	
		lat : Number,
		lon : Number
	},
	gdp: { type: Number, default: 0 },
	pop:  { type: Number, default: 0 },
	
	*/
})

var Country = mongoose.model('Country', Country)

exports.Country = Country

exports.create_country = function(country) {
		return function() {
			return new Promise( function(res, rej) {
				Country.create({num: country.num, name: country.name, url: country.url}, function(err, db_country) {
					if (err) {rej(err)}
					else {
						debug({num: country.num, name: country.name, url: country.url}, 'was persisted to db')
						res(country)
					}

				})
			})
		}
}

exports.getCountryInfo = function(title) {	
	return new Promise(function(res, rej) { 
	
		Country.findOne({name: title}, function(err, c) {
			debug('getCountryInfo', c.name, c.flag)

			if (err) { rej(err) }
			if (c) {
				//debug('get country info', {type: 'node', name: c.name, img: c.flag})
				res({type: 'node', name: c.name, img: c.flag})
			} else { rej('Can\'t find country') }
		})

	})

}

exports.checkIfFreqDist = function(country) {
	return new Promise(function(res, rej) {
		debug('checkIfFreqDist', country)

		Country.findOne({name: country.name}, function(err, c) {
			if (err) { rej(err) }
			if (c) {
				debug(country.name+'\'s fd_bg.length is '+c.fd_bg.length)
				
				if (c.fd_bg.length > 0) {
					country['fd_bg'] = true
				} else { 
					country['fd_bg'] = false
				}
			}
			res(country)
		})
	})
}

/* OLD VERSION
exports.checkIfCrawledAlready = function(countryList) {
	
	return new Promise(function(res, rej) { 

		//  c: list containing already crawled country names
		// nc: list containing non-crawled country names 
		var ret = {c: [], nc: []};
	
		countryList.forEach(function(country, i, arr) {
			debug('checkIfCrawledAlready', country, i)
			Country.findOne({name: country}, function(err, c) {
				if (err) { rej(err) }
				if (c && c != 'undefined') {
					//if (c.h2[0] && c.h2[0] != 'undefined') {
					//	if (c.h2[0].p.length > 0)  {
					if (c.name && c.name!='undefined' 
						&& c.url && c.url!='undefined' 
						&& c.flag && c.flag!='undefined') {
							if (c.name.length>0 && c.url.length>0 && c.flag.length>0) {
								debug('checkIfCrawledAlready c.h2[0].p.length > 0')
								ret.c.push(country)	
							} else { ret.nc.push(country) }
					} else { ret.nc.push(country) }
				} else { ret.nc.push(country) }

				if (i == arr.length-1) res(ret)
			})
		})
	})

}
*/

exports.checkIfCrawled = function(countryList) {
	//  c: list containing already crawled country names
	// nc: list containing non-crawled country names 
	var ret = {c: [], nc: []};

	return Promise.map(countryList, function(country) {
		return Country.findOne({name: country}, function(err, c) {
			if (err) { throw Error(err) }
			if (c && c != 'undefined') {
				if (c.name && c.name!='undefined' 
					&& c.url && c.url!='undefined' 
					&& c.flag && c.flag!='undefined') {
						if (c.name.length>0 && c.url.length>0 && c.flag.length>0) {
							debug('c.name, c.url, c.flag exist for '+country)
							ret.c.push(country);
							return country;	
						} else { ret.nc.push(country); return country; }
				} else { ret.nc.push(country); return country; }
			} else { ret.nc.push(country); return country; }

		})
	}).then(function() {
		return Promise.resolve(ret)
	}).catch(function(e) {
		return Promise.reject(e)
	})

}

exports.checkIfLink = function(country, otherCountry) {

	return new Promise(function(res, rej) {
		
		debug("checkIfLink", country, otherCountry)
		_checkIfLink(country, otherCountry)
			.then(function(AB) {
				if (AB.err) Promise.reject(AB.err)
				if (!AB.ret) {
					return _checkIfLink(otherCountry, country)
				} else {
					return Promise.resolve({err: null, ret:AB.ret})
				}
			})
			.then(function(BA) {
				if (BA.err) Promise.reject(BA.err)
				if (!BA.ret) { 
					res(null) 
				} else {
					res({ type: "link", source: country, target: otherCountry, dist: BA.ret.dist, bg_common: BA.ret.bg_common }) 
				}
			})
			.catch(function(e) {
				rej(e)
			})

	})
}

function _checkIfLink(country, otherCountry) {
	debug('_checkIfLink', country, otherCountry)
	return new Promise(function(res, rej) {
		Country.findOne({name: country}, function(err, c) {
				if (err) { res({ err: err, ret: null}) }
				if (c) {
					var foundEdge = findEdge(otherCountry, c.edges)
					if (foundEdge) {
						debug('_checkIfLink found edge', { type: "link", source: country, target: otherCountry, "ret" : foundEdge})
						res({ err: null, ret: foundEdge })
					} else {
						debug('_checkIfLink !foundEdge)', { err: null, ret: null }) 
						res({ err: null, ret: null })
					}
				} else {
					debug('_checkIfLink !c', { err: null, ret: null }) 
					res({ err: null, ret: null })
				}
		})
	})
}

function findEdge(c, edges) {
	debug('findEdge', c, 'has', edges.length, 'edges')
	for (i in edges) { 
		if (c === edges[i].country && !isNaN(edges[i].dist)) {
			return {dist: edges[i].dist, bg_common: edges[i].bg_common}
		}
	}
	return false
}

exports.update_country = function(cond, update, callback) {

    var condition = {name: cond}
    var options = null

    Country.findOneAndUpdate(condition, update, options, callback)
}

exports.socketTTL = function(id) {

	return new Promise(function(res, rej) {
    
	    var rdskey = 'sock_rl:' + id;

	    redis.multi()
	      .incr(rdskey)
	      .ttl(rdskey)
	      .exec(function(err, replies) {
	        if (err) {
	          return rej(err);
	        }
	        // if this is new or has no expiry
	        if (replies[0] === 1 || replies[1] === -1) {
	          // then expire it after the timeout
	          redis.expire(rdskey, 30);
	        }
	        // resolve TTL
	        res(replies[0]);
	      });

	});

  };

  exports.saveSockReq = function(ip, countries) { 

  	var key = 'persistSock_' + ip;
  	var now = Date.now();

  	redis.exists(key, function(e, r) { 
  	  if (r == 1) {
  	    redis.hget(key, 'c', function(e, d) {
  	      if (e) { 
  	      	debug(e);
  	      } else { 
  	        var new_c = parseInt(d);
  	        new_c += 1;

  	        sockObj = {c: new_c}
  	        sockObj[now] = countries


  	        redis.hmset(key, 
  	        sockObj,
  	     	function(e,d) { 
  	          if (e) {
  	          	debug(e);
  	          } 
  	          return;
  	        })
  	      }
  	    })
  	  } else {
  	  	sockObj = {c: 1, t0: Date.now()}
  	  	sockObj[now] = countries
  	    redis.hmset(key,
		sockObj,
  	    function(e,d) { 
  	      if (e) {
  	      	debug(e)
  	      } 
  	      return;
  	    })
  	  }
  	})

  }

exports.saveReq = function(ip) { 

	var key = 'persistIp_' + ip;
	redis.exists(key, function(e, r) { 
	  if (r == 1) {
	    redis.hget(key, 'c', function(e, d) {
	      if (e) { 
	      	debug(e);
	      } else { 
	        var new_c = parseInt(d);
	        new_c += 1;
	        redis.hmset(key, 
	        { 
	         'c': new_c, // update request count
	         't1': Date.now() // last time connection
	     	}, 
	     	function(e,d) { 
	          if (e) {
	          	debug(e);
	          } 
	          return;
	        })
	      }
	    })
	  } else {
	    redis.hmset(key,
	    {
	      c: 1, // request count
	      t0: Date.now(), // first time connection
	      t1: '' 
	    },
	    function(e,d) { 
	      if (e) {
	      	debug(e)
	      } 
	      return;
	    })
	  }
	})

}
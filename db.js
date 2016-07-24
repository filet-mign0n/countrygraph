var mongoose = require('mongoose')
var Schema = mongoose.Schema
var Promise = require('bluebird')
var exports = module.exports

var config = require('config')
var url = 'mongodb://' + config.get('mongo.host') + ':' + config.get('mongo.port') + '/' + config.get('mongo.db')

mongoose.connect(url, function(err) {
	if (err) throw (err)
})

var h2_Schema = new Schema({ title: String, p: String }, { noId: true });
var edgeList_Schema = new Schema({ country: String, dist: Number }, { noId: true });

var Country = new Schema({
	num: { type: Number, required : true }, //unique: true
	name: { type: String, required : true }, //unique: true
	url: String,
	flag: String,
	create_date: { type: Date, default: Date.now },
	h3: Array,
	h2: [h2_Schema],
	fd_bg: Array,
	fd_uno: Array,
	edges: [edgeList_Schema],
	latlong: {
		url: String, 	
		lat : Number,
		lon : Number
	},
	gdp: { type: Number, default: 0 },
	pop:  { type: Number, default: 0 },

})

var Country = mongoose.model('Country', Country)

exports.create_country = function(country) {
		return function() {
			return new Promise( function(res, rej) {
				Country.create({num: country.num, name: country.name, url: country.url}, function(err, db_country) {
					if (err) {rej(err)}
					else {
						console.log({num: country.num, name: country.name, url: country.url}, 'was persisted to db')
						res(country)
					}

				})
			})
		}
}

exports.getCountryInfo = function(title) {
	
	return new Promise(function(res, rej) { 
	
		Country.findOne({name: title}, function(err, c) {
			console.log('getCountryInfo', c.name, c.flag.slice(-20))

			if (err) { rej(err) }
			if (c) {
				//console.log('get country info', {type: 'node', name: c.name, img: c.flag})
				res({type: 'node', name: c.name, img: c.flag})
			}
		})

	})

}

exports.checkIfCrawledAlready = function(countryList) {
	
	return new Promise(function(res, rej) { 

		//  c: list containing already crawled country names
		// nc: list containing non-crawled country names 
		ret = {c: [], nc: []}
	
		countryList.forEach(function(country, i, arr) {
			console.log('checkIfCrawledAlready ', country, i)
			Country.findOne({name: country}, function(err, c) {
				if (err) { rej(err) }
				if (c) {
					if (c.h2[0].p.length > 0)  {
						console.log('checkIfCrawledAlready c.h2[0].p.length > 0')
						ret.c.push(country)	
					} else { ret.nc.push(country) }
				} else { ret.nc.push(country) }

				if (i == arr.length-1) res(ret)
			})
		})
	})

}


exports.update_country = function (cond, update, callback) {

    var condition = {name: cond}
    var options = null

    Country.findOneAndUpdate(condition, update, options, callback)
}
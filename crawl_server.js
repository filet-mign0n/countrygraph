var Crawler = require("crawler")
var Promise = require('bluebird')
var config = require('config')
var wc = require('./word_counter.js')
var db = require('./db.js')

const list_countries_url = 'https://en.wikipedia.org/wiki/List_of_countries_and_dependencies_by_area'
const source_url = 'https://en.wikipedia.org'

var emittedCountries = []

function isInArray(value, array) {
  return array.indexOf(value) > -1;
}

/*
function createCompareArray(c, nc, country) {
    var countriesSorted = c.concat(nc)
    countriesSorted.splice(countriesSorted.indexOf(country), 1)

    return countriesSorted
}
*/

module.exports = function(httpServer) {

        var io = require('socket.io')(httpServer)
        io.sockets.on('connection', function(socket) {
		  
            socket.on('c', function(data) {
                if (Array.isArray(data) && data.length) {
                    console.log('socket on c', data)
                    emittedCountries.length = 0

                    db.checkIfCrawledAlready(data)
                        .then(function(countryList) {
                            
                            console.log("checkedIfCrawled list", countryList)
                            if (countryList.c.length) noCrawl(socket, countryList)
                            if (countryList.nc.length) Crawl(socket, countryList)

                        })
                        .catch(function(e) { console.log(e) })

                }
            })
          
        })

}

var r = Promise.resolve()
var sessionCountries = {}


// Already crawled
function noCrawl(socket, countryList) {

    console.log('\nnoCrawl', countryList.c)

    countryList.c.forEach(function(name) {

        console.log('noCrawl forEach', name)
        r = r
            .then(function() {
                console.log('\n')
                return db.getCountryInfo(name) 
            })
            .then(function(c) {
                return new Promise(function(res, rej) { 
                    socket.emit('crawl', c)
                    emittedCountries.push(c.name)
                    res( { name: c.name } )
                })
            })
            .then(db.checkIfFreqDist)
            .then(function(c) { 
                if (!c.fd_bg) {
                    console.log('c.fd_bg', c.fd_bg, 'return wc.py_freqDist(c)')
                    return wc.py_freqDist(c)
                } else {
                    console.log('c.fd_bg', c.fd_bg, 'do not return wc.py_freqDist(c)')
                    return Promise.resolve(c)
                }
            })
            .then(function(c) {
                // copy current list of emitted nodes
                var compareArray = emittedCountries.slice()
                // remove current country from list
                compareArray.splice(compareArray.indexOf(c.name), 1)
                console.log(c.name+'\'s compareArray', compareArray)

                if (compareArray.length) return compare(socket, c.name, compareArray)            
                else return Promise.resolve()
            })
            /*.then(function(country) {
                if (country.links) {
                    for (i in country.links) {
                        socket.emit('crawl', JSON.parse(country.links[i]));
                        //console.log('sent crawl event with links: '+country.links)
                    }
                } else { Promise.resolve() }
            })*/
            .catch(function(e) { console.log(e) })
    })

    return r

}

function compare(socket, country, countries) {
    console.log('\ncompare', country, countries)

    r = Promise.resolve()
    return new Promise(function(res, rej) {

        countries.forEach(function(otherCountry, i, arr) {
            console.log('compare countries forEach', otherCountry)
            
            r = r
                .then(function() {
                    return db.checkIfLink(country, otherCountry)
                })
                .then(function(c) {
                    if (!c) {
                        console.log('no link between', country, 'and', otherCountry, 'engaging wc.py_compare_freqDist')
                        return wc.py_compare_freqDist(country, otherCountry)
                    } else {
                        console.log('found link between', country, 'and', otherCountry, ':\n', c)
                        return Promise.resolve(c)
                    }
                }) 
                .then(function(c) {
                    return new Promise(function(res, rej) {   
                        console.log('final', c)
                        socket.emit('crawl', c)
                        res()
                    })
                })
                .catch(function(e) { rej(e) })

            if (i == arr.length-1) res()
        
        })

        return r

    })
}


var c = new Crawler({
    maxConnections : 10,
    rateLimits: 0
})

/* The first crawl queue finds the wikipedia pages of all countries listed in country_list 
on the list_countries_url page and persists the data to the `countries` collection */
function Crawl(socket, countryList) {   

    console.log('\nCrawl', countryList.nc)
    
    c.queue({
        uri: list_countries_url,
        callback: function (error, result, $) {
            if (error) {throw (error)}
            var count = 0
            
            function Qs() {
                $('.flagicon+ a')
                    .each(function(i, a) {
                
                        var title = $(a).attr('title')

                        //console.log("$('.flagicon+ a').each", countryList, title)

                        
                        if (!isInArray(title, countryList.nc)) { 
                            //console.log(title, countryList))
                            return 
                        
                        } else {
                            
                            console.log('found '+title+' in wikipedia page to crawl')
                            country = { num: i,
                                        name : title,
                                        url: source_url+$(a).attr('href'),
                            }
                            
                            r = r
                                .then(db.create_country(country))
                                .then(function(country) {
                                    return secondQueue(country, socket)
                                })
                                .then(wc.py_freqDist)
                                //TODO
                                .then(function(country) {
                                    if (country.links) {
                                        for (i in country.links) {
                                            socket.emit('crawl', JSON.parse(country.links[i]));
                                            console.log('sent crawl event with links: '+country.links)
                                        }
                                    } else { Promise.resolve() }
                                })
                                .catch(function(e) { console.log(e) })
                        }
                })   
                return r
            }
            Qs()        
        }
    })
    socket.on('disconnect', function() {
    console.log('client disconnected whilst in first queue')
  })

}

/* The second crawl queue looks for country flag images' href and <p> tag content under <h2> 
containing the token "history" and persists the data to the `countries` collection */
function secondQueue(country, socket) {

    console.log("\nsecond queue "+country.name+"\n") 
    
    return new Promise( function(res, rej) {

        c.queue({
            
            uri: country.url,
            
            callback: function (error, result, $) {
                
                if (error) throw (error)

                if ($('table.infobox').eq(0).find('img').attr('src')) {
                    var img_url = $('table.infobox').eq(0).find('img').attr('src')
                    country['flag'] = img_url.slice(2)
                }
                
                //emit vertex data, edges will be caclulate at next step
                var node = {type: 'node', name: country.name, img: country.flag}
                console.log('graph node about to be emitted: ', node)
                socket.emit('crawl', node)

                db.update_country(country.name, 
                    {$push: 
                        {"h2": 
                            { 
                            "title": $("h2:contains('History')").text(),
                            "p": $("h2:contains('History')").nextUntil($('h2'), 'p').text()
                            }
                        },
                     "flag": country.flag
                    },
                    function(err) { if (err) rej(err) })

                res(country)

                }
            })
        })
}


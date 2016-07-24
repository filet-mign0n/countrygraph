var Crawler = require("crawler")
var Promise = require('bluebird')
var config = require('config')
var wc = require('./word_counter.js')
var db = require('./db.js')

const list_countries_url = 'https://en.wikipedia.org/wiki/List_of_countries_and_dependencies_by_area'
const source_url = 'https://en.wikipedia.org'

//var country_list = config.get('country_list')

function isInArray(value, array) {
  return array.indexOf(value) > -1;
}

module.exports = function(httpServer) {

        var io = require('socket.io')(httpServer)
        io.sockets.on('connection', function(socket) {
		  
            socket.on('c', function(data) {
                if (Array.isArray(data) && data.length > 0) {

                    console.log('socket on c', data)
                    
                    db.checkIfCrawledAlready(data)
                        .then(function(countryList) {
                            
                            console.log("checkedIfCrawled list", countryList)
                            
                            noCrawl(socket, countryList.c)
                            Crawl(socket, countryList.nc)

                        })
                        .catch(function(e) { console.log(e) })

                }
            })
          
        })

}

var r = Promise.resolve()
var sessionCountries = {}


//already crawled
function noCrawl(socket, countryList) {

    console.log('noCrawl', countryList)

    countryList.forEach(function(name) {

        console.log('noCrawl forEach', name)
        r = r
            .then(function() {
                return db.getCountryInfo(name) 
            })
            .then(function(d) {
                
                return new Promise(function(res, rej) { 
                    socket.emit('crawl', d)
                    res(d)
                })
            })
            .then(wc.py_word_counter)
            .then(function(country) {
                if (country.links) {
                    for (i in country.links) {
                        socket.emit('crawl', JSON.parse(country.links[i]));
                        //console.log('sent crawl event with links: '+country.links)
                    }
                } else { Promise.resolve() }
            })
            .catch(function(e) { console.log(e) })
    })

    return r

}


var c = new Crawler({
    maxConnections : 10,
    rateLimits: 0
})

/* The first crawl queue finds the wikipedia pages of all countries listed in country_list 
on the list_countries_url page and persists the data to the `countries` collection */
function Crawl(socket, countryList) {   

    console.log('function Crawl()', countryList)
    
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

                        
                        if (!isInArray(title, countryList)) { 
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
                                .then(wc.py_word_counter)
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


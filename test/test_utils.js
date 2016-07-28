var socket = require('socket.io-client')

module.exports.ws_client = function() {
	
	return socket('http://localhost:8000')

}

module.exports.find_country_doc = function(name, obj) {
	for (i in obj) { 
		if (name === obj[i].name) {
			return obj[i]
		}
	}
	return null
}

module.exports.findEdge = function(name, edges) {
	for (i in edges) { 
		if (name === edges[i].country && !isNaN(edges[i].dist)) {
			return edges[i].dist
		}
	}
	return null
}
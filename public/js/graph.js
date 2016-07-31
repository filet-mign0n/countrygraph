const max_countries = 10;
var selected = [];
var emitted = false;
var socket;
var graph;
var map;
var w = $(window).width()-30;
var h = $(window).height()-90;
var r = 30;

$(document).ready(function() {

    ws('ws://' + window.location.host);

    map = $('#vmap').vectorMap(
    {
        map: 'world_en',
        showTooltip: true,
        enableZoom: true,
        multiSelectRegion: true,
        onRegionClick: mapClickHandler,
    });

    graph = new myGraph("#graph");

});

function mapClickHandler(e, cc, r) {
    console.log('clicked on', cc, r)
    switch(cc) {
        case "ru":
            r = "Russia"
            break;
        case "us":
            r = "United States"
            break;
        case "cd":
            r = "Democratic Republic of the Congo"
            break;
        case "cg":
            r = "Republic of the Congo"
            break;
        case "la":
            r = "Laos"
            break;
    }
    prepQuery(r, cc)
}

// needed for when user restarts
JQVMap.prototype.deselectAll = function() {
  var self = this;
  var selectedCCs = this.selectedRegions.slice()

  for (i in selectedCCs) {
      console.log("dAll", selectedCCs[i])
      self.deselect(selectedCCs[i])
  };
};


function prepQuery(c, cc) {
    for (i in selected) {
        if (selected[i] === c) {
            selected.splice(i, 1)
            $("#"+cc).remove()
            return
        } 
    }
    selected.push(c)
    $("<p class=\"ccp\" id=\""+cc+"\">"+c+"</p>").insertBefore("#emitButton")
    if (selected.length >= max_countries) promptSelection()
}

function promptSelection() {
    $('#vmap').css("pointer-events", "none");
    alert('reached max number of countries')
}

function emit(input_value) {
    if (emitted) {
        alert('already emitted query, click reset to start over')
        return
    }
    if (selected.length <= 1) { 
        alert('click on a least 2 countries')
        return
    }
    emitted = true;
    $("#vmap").hide(500);
    socket.emit('c', selected);
    console.log("socket.emit('c', ", selected);
}

function restart() {
    emitted = false;
    map.deselectAll();
    selected.length = 0;
    graph.reset();
    $('#vmap').css("pointer-events", "auto");
    $(".ccp").fadeOut(150, function() { $(this).remove(); })
    $("#vmap").show(700)
}

function ws(ws_url) {
    console.log('ws started')
    socket = io.connect(ws_url)

    socket.on('crawl', function(data) {

        console.log("received data from ws: ",data)

        if (data.type == 'node') {
            graph.addNode(data.name, data.img)
        } 
        else if (data.type == 'link') {
            if (data.dist > 1)
                var dist = (1/data.dist)*1400
                //var dist = parsed_data.dist >= 5 ? (1/parsed_data.dist)*1400 : 100
                graph.addLink(data.source, data.target, dist)
        }
        else {console.log('\nweird crawl packet received :-/')}

    })

    $(window).on("beforeunload", function() { 
        console.log('disconnecting socket before closing window')
        socket.disconnect()
    })
} 

function myGraph(el) {
    
    this.addNode = function (id, img) {
        nodes.push({"id":id, "img": img});
        update();
    }

    this.removeNode = function (id) {
        var i = 0;
        var n = findNode(id);
        while (i < links.length) {
            if ((links[i]['source'] === n)||(links[i]['target'] == n)) links.splice(i,1);
            else i++;
        }
        var index = findNodeIndex(id);
        if(index !== undefined) {
            nodes.splice(index, 1);
            update();
        }
    }

    this.addLink = function (sourceId, targetId, dist) {
        var sourceNode = findNode(sourceId);
        var targetNode = findNode(targetId);
        var dist = parseInt(dist)

        console.log('this.addLink with args :\n'+sourceId+' '+targetId+' '+dist)
        if((sourceNode !== undefined) && (targetNode !== undefined) && dist > 0) {
        	console.log('pushing links')
            links.push({"source": sourceNode, "target": targetNode, "dist": dist});
            update();
        }
    }

    var findNode = function (id) {
        for (var i=0; i < nodes.length; i++) {
            if (nodes[i].id === id)
                return nodes[i]
        };
    }

    var findNodeIndex = function (id) {
        for (var i=0; i < nodes.length; i++) {
            if (nodes[i].id === id)
                return i
        };
    }

    this.reset = function() {
        nodes.length = 0
        links.length = 0
        update()
    }

    var vis = this.vis = d3.select(el).append("svg:svg")
        .attr("width", w)
        .attr("height", h);

    var force = this.force = d3.layout.force()
        .gravity(.05)
        .charge(-100)
        .size([w, h])
        .distance(100)
        .linkDistance( function(link) {
        	return link.dist
        });

    var nodes = force.nodes(),
        links = force.links();

	var l1 = vis.append('g'),
        l2 = vis.append('g');

    var update = function (t) {

        var node = l2.selectAll("g.node")
            .data(nodes)

        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .call(force.drag);

        nodeEnter.append('circle')
            .attr("cx", "0px")
            .attr("cy", "0px")
        	.attr("r", 27)
        	.style({"fill": "grey", "opacity": 0.2})

        nodeEnter.append("image")
            .attr("xlink:href", function(d) { return 'https://'+d.img})
            .attr("x", "-13px")
            .attr("y", "-23px")
            .attr("width", "26px")
            .attr("height", "26px");

        nodeEnter.append("text")
            .attr("class", "nodetext")
            .attr("dy", "15")
            .attr("text-anchor", "middle")
            .text(function(d) {return d.id});

        node.exit().remove();

        var link = l1.selectAll("line.link")
            .data(links)

        link.enter().append("line")
            .attr("class", "link")
            .style("stroke", "#696969")
            .style("stroke-width", "2")
            .style("opacity", 0.5)

        link.exit().remove();

        force.on('tick', function() {

            var nw = $(window).width()-30
            var nh = $(window).height()-90

            node.attr("transform", function(d) { return "translate(" + Math.max(r, Math.min(nw - r, d.x)) + "," + Math.max(r, Math.min(nh - r, d.y)) + ")"; });
            
            link
              .attr("x1", function(d) { return Math.max(r, Math.min(nw - r, d.source.x))})
              .attr("y1", function(d) { return Math.max(r, Math.min(nh - r, d.source.y))})
              .attr("x2", function(d) { return Math.max(r, Math.min(nw - r, d.target.x))})
              .attr("y2", function(d) { return Math.max(r, Math.min(nh - r, d.target.y))})

        });

        // Restart the force layout.
        force.start();
        // Keep alive
        force.on("end", function() { force.alpha(0.01)});
    }

    update(this);
    
}

$(window).resize(function() {
    new_w = $(window).width()-30
    new_h = $(window).height()-90

    graph.vis
        .attr('height', new_h) 
        .attr( 'width', new_w)
        
    graph.force 
        .size([$(window).width(), $(window).height()])
})  



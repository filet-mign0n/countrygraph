CountryGraph [![Build Status](https://travis-ci.org/filet-mign0n/countrygraph.svg?branch=master)](https://travis-ci.org/filet-mign0n/countrygraph)
========

Compare the history of countries by rendering a force directed graph. Try live version [here](http://plasti.city)

##How it works

<img src="https://raw.githubusercontent.com/filet-mign0n/filet-mignon.github.io/master/images/countrygraph_diagram.png">

###Backend

Sequencial Flow control patterns in node.js. Promises excel at representing dependency directed acyclic graphs (DAGs).
Tasks are transactional, in the sense that they either completely fail or completely succeed, making jobs (mostly) idempotent, and storing all inputs and outputs in a resilient store (Mongodb)

###Frontend 
Via WebSockets events, a [D3js Force Directed Graph](https://bl.ocks.org/mbostock/4062045) is progressively built, first the nodes are generated, then edges are generated node by node, avoiding dubplication of work in the process.
The graph is a physical simulation of charged particles and springs, it places related countries in closer proximity, while unrelated countries are farther apart. Layout algorithm inspired by Tim Dwyer and Thomas Jakobsen.

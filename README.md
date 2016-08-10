CountryGraph [![Build Status](https://travis-ci.org/filet-mign0n/countrygraph.svg?branch=master)](https://travis-ci.org/filet-mign0n/countrygraph)
========
Compare the history of countries by rendering a force directed graph. Try live version [here](ec2-54-186-48-151.us-west-2.compute.amazonaws.com)

##How it works

###Backend
Real-time directed acyclic graph of dependencies. Flow control patterns in node.js, in this case Sequencial.

Tasks are transactional, in the sense that they either completely fail or completely succeed.
making jobs (mostly) idempotent, and storing all inputs and outputs in a resilient store (Mongodb)

I found promises are well-suited to representing the complex IO dependency patterns required in our application. Furthermore, the Promises/A+ specification backing up the promises implementation provides strong guarantees useful in reasoning about these control flows, especially with respect to error handling.

* Provide a uniform interface to chain sequential steps in a pipeline in the form of the .then() method.
* Always proceed from one step of a pipeline to the next asynchronously.
* Handle and propagate errors in a predictable, well-defined manner.

###Frontend 
Via WebSockets events, a [D3js Force Directed Graph](https://bl.ocks.org/mbostock/4062045) is progressively built, first the nodes are generated, then edges are generated node by node, avoiding dubplication of work in the process.
The graph is a physical simulation of charged particles and springs, it places related countries in closer proximity, while unrelated countries are farther apart. Layout algorithm inspired by Tim Dwyer and Thomas Jakobsen.

##Installing 

###Dependencies 
* Node.js
* Mongodb
* Redis

###Configuration
Config files can be found in config folder. 

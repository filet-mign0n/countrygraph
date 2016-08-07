#CountryGraph [![Build Status](https://travis-ci.org/filet-mign0n/countrygraph.svg?branch=master)](https://travis-ci.org/filet-mign0n/countrygraph)
========

Real-time directed acyclic graph of dependencies

Tasks are transactional, in the sense that they either completely fail or completely succeed.
making jobs (mostly) idempotent, and storing all inputs and outputs in a resilient store (Mongodb)
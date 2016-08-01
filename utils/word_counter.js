const debug = require('debug')('countrygraph')  
var Promise = require('bluebird');
var cp = require('child_process').exec

module.exports.py_freqDist = function(country) {
  
  return new Promise(function(resolve, reject) {
    
    debug('freqDist.py '+country.name)
    
    cp('python '+__dirname+'/py_modules/freqDist.py "'+country.name+'"', 
      
      function(error, stdout, stderr) {
        
        if (error) { reject(error) }
        if (stderr) { reject(stderr) }
        
        if (stdout =='nada\n' || stdout == '' || stdout == undefined) { 
          
          debug('freqDist.py returned no stdout');
          resolve(country)
        
        } else {

          debug('freqDist.py done, with stdout:', stdout.substring(0, stdout.length - 1));
          resolve(country)
        
        }
    
    })
  })
}

module.exports.py_compare_freqDist = function(country, otherCountry) {
  
  return new Promise(function(resolve, reject) {
    
    debug('compare_freqDist.py '+country+' & '+otherCountry)
    cp('python '+__dirname+'/py_modules/compare_freqDist.py "'+country+'" "'+otherCountry+'"', 
      
      function(error, stdout, stderr) {
        
        if (error) { reject(error) }
        if (stderr) { reject(stderr) }
        
        if (stdout =='nada\n' || stdout == '' || stdout == undefined) { 
          debug('compare_freqDist.py between', country, otherCountry, 'no stdout');
          resolve(country)
        } else {
          debug('compare_freqDist.py between', country, otherCountry, 
                "got stdout", stdout.substring(0, stdout.length - 1));
          resolve(JSON.parse(stdout));
        }  

    })
  })
}
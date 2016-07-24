var Promise = require('bluebird');
var cp = require('child_process').exec

module.exports.py_word_counter = function(country) {
  
  return new Promise(function(resolve, reject) {
    
    console.log('\nfreqDist.py '+country.name+'\n')
    
    cp('python ./freqDist.py "'+country.name+'"', 
      function(error, stdout, stderr) {
        
        if (error) { reject(error) }
        
        if (stdout =='nada\n' || stdout == '' || stdout == undefined) { 
          console.log('no stdout');
          resolve(country)

        } else {
          country['links'] = JSON.parse(stdout)
          console.log('freqDist.py about to res country obj:', country)
          resolve(country)
        }     
    
    })
  })
}

module.exports.py_compare_fds = function(country) {
  
  return new Promise(function(resolve, reject) {
    
    console.log('\nword_counter.py '+country.name+'\n')
    
    cp('python ./freqDist.py "'+country.name+'"', 
      function(error, stdout, stderr) {
        
        if (error) { reject(error) }
        
        if (stdout =='nada\n' || stdout == '' || stdout == undefined) { 
          console.log('no stdout');
          resolve(country)

        } else {
          country['links'] = JSON.parse(stdout)
          console.log('py_word_counter about to res country obj:', country)
          resolve(country)
        }     
    
    })
  })
}
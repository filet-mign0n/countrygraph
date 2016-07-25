var Promise = require('bluebird');
var cp = require('child_process').exec

module.exports.py_freqDist = function(country) {
  
  return new Promise(function(resolve, reject) {
    
    console.log('\nfreqDist.py '+country.name+'\n')
    
    cp('python ./freqDist.py "'+country.name+'"', 
      
      function(error, stdout, stderr) {
        
        if (error) { reject(error) }
        if (stderr) { reject(stderr) }
        
        if (stdout =='nada\n' || stdout == '' || stdout == undefined) { 
          
          console.log('freqDist.py returned no stdout');
          resolve(country)
        
        } else {

          console.log('freqDist.py done, with stdout:', stdout)
          resolve(country)
        
        }
    
    })
  })
}

module.exports.py_compare_freqDist = function(country, otherCountry) {
  
  return new Promise(function(resolve, reject) {
    
    console.log('compare_freqDist.py '+country+' & '+otherCountry)
    cp('python ./compare_freqDist.py "'+country+'" "'+otherCountry+'"', 
      
      function(error, stdout, stderr) {
        
        if (error) { reject(error) }
        if (stderr) { reject(stderr) }
        
        if (stdout == '' || stdout == undefined) { 
          console.log('no stdout');
          resolve(country)
        } else {
          console.log('compare_freqDist.py done, with JSON.parse(stdout)', stdout, stderr)
          resolve(JSON.parse(stdout))
        }  

    })
  })
}
var argv = require('yargs').argv
var through = require('through2')
var split = require('split2')

var maxStorageSize = argv['size'] || 10000
var interval = argv['log'] || 1;



function source() {
  var s = through()
  function generate() {
    var n = Math.random()
    var data = {number: n, field: n, test: n}
    s.push(JSON.stringify(data) + '\n')
    setImmediate(generate, 0)
    //process.nextTick(generate)
  }
  process.nextTick(generate)
  return s;
}


function processor() {
  var storage = []
  var gens    = 0

  function criteria(o1, o2) {
    return o1.number < o2.number ? -1
         : o1.number > o2.number ?  1 
         : 0
  }

  return through(function(data, enc, done) {
    var res = JSON.parse(data)
    storage.push(res)
    if (storage.length > maxStorageSize) { 
      //storage.sort(criteria)
      this.push(JSON.stringify(storage) + '\n')
      storage = []
      if (++gens % interval === 0) {
        console.log("=========================")
        console.log("Generation", gens)
        console.log("=========================")
      }
    }
    done()
  })
}

source()
.pipe(split())
.pipe(processor())
.on('data', function(){})

var argv = require('yargs').argv
var through = require('through2')
var split = require('split2')
var process = require('process')
var exec = require('child_process').exec

var maxStorageSize = argv['storageSize'] || 10000
var repetitions    = argv['repetitions'] || 30

function source() {
  var s = through()
  function generate() {
    for (var k = 0; k < maxStorageSize / 1000; ++k) {
      var n = Math.random()
      var data = {number: n, field: n, test: n}
      s.push(JSON.stringify(data) + '\n')
    }
    setTimeout(generate, 1)
  }
  generate()
  return s;
}


function processor() {
  var storage = []

  var usages = [];

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
      if (global.gc) global.gc();
      var memUse = process.memoryUsage().rss / 1024 / 1024;
      usages.push(memUse);
      console.log("Repetition", usages.length, "of", repetitions, ":", memUse.toFixed(1), "MB")
      if (usages.length >= repetitions) {
        console.log("=========================")
	    console.log("Peak memory usage", Math.max.apply(Math, usages).toFixed(1), "MB")
        console.log("=========================")
        process.exit(0)
      }
    }
    done()
  })
}

function run() {
    source()
    .pipe(split())
    .pipe(processor())
    .on('data', function(){})
}

if (!argv.run) {
    console.log("With forced GC")
    var p = exec(process.argv[0] + " --expose-gc ./index.js --run")
    p.stdout.pipe(process.stdout)
    p.on('exit', function() {
        console.log("With automatic GC")
        p = exec(process.argv[0] + " index.js --run")
        p.stdout.pipe(process.stdout)
    })

} else {
    run()
}
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
  var usages  = [];

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
      console.log("Repetition %s of %s : %s MB", usages.length, repetitions, memUse.toFixed(1))
      if (usages.length >= repetitions) {
        console.log("=========================")
	    console.log("Peak memory usage: %s MB", Math.max.apply(Math, usages).toFixed(1))
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

function execExtract(str, cb) {
    var p = exec(str)
    p.stdout.pipe(process.stdout)
    p.stdout.pipe(split()).pipe(through(function(data, enc, done) {
        if (!/^Peak memory usage/.test(data)) return done()
        var megabytes = data.toString().split(' ')[3]
        cb(null, megabytes)
    }))
}

if (!argv.run) {
    console.log("With forced GC")
    execExtract(process.argv[0] + " --expose-gc ./index.js --run", function(err, forcedMB) {
        console.log("With automatic GC")
        execExtract(process.argv[0] + " index.js --run", function(err, automaticMB) {
            var increase = automaticMB - forcedMB;
            console.log("Increase: %s MB, %s %", increase.toFixed(1), (100 * increase / forcedMB).toFixed(1));
        })
    })
} else {
    run()
}
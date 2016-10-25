var request = require('request')
var async = require('async')
var fs = require('fs')
var mkdirp = require('mkdirp')
var path = require('path')

var dataDir = path.join(__dirname, 'data')
var dbDir = path.join(__dirname, 'db')

async.waterfall([
  getPackages,
  loadPackages,
  getPackageNames,
  cache,
  getDB
], function (e) {
  if(e) throw e
  console.log('DONE!')
})

function getPackages(cb) {
  try {
    var file = fs.statSync('./packages.json')
  } catch (e) {
    var file = {}
  }

  if(file.isFile) {
    console.log('Package list already downloaded, continuing')
    return setImmediate(cb)
  }

  file = fs.createWriteStream('./packages.json')
  file.on('finish', function () {
    return setImmediate(cb)
  })

  console.log('Downloading package list...')
  return request(`https://skimdb.npmjs.com/registry/_changes/`)
    .on('error', function (e) {
      fs.unlinkSync('./packages.json')
      return setImmediate(cb, e)
    })
    .pipe(file)
}

function loadPackages(cb) {
  try {
    return setImmediate(cb, null, require('./packages.json').results)
  } catch(e) {
    return cb(e)
  }
}

function getPackageNames(packages, cb) {
  return setImmediate(cb, null, packages.map(function (v) {
    return v.id
  }))
}

function cache(packages, cb) {
  mkdirp('./db', function (e) {
    return setImmediate(cb, e, packages)
  })
}

function getDB(names, cb) {
  console.log('Downloading registry... (using cache where possible)')
  var i = 0
  async.eachLimit(names, 1000, function (v, cb) {
    if(++i % 10000 === 0) console.log(i)
    var scrubbedName = v.replace('/', '_slash_')
    var filePath = path.join('.','db',`${scrubbedName}.json`)
    try {
      var file = fs.statSync(filePath)
    } catch(e) {
      var file = {}
    }

    if(file.isFile) { return setImmediate(cb) }

    async.retry({}, function (cb) {
      request(`https://skimdb.npmjs.com/registry/${v}`, function (e, resp) {
        if(e) return cb(e)
        return fs.writeFile(filePath, resp.body, 'utf8', cb)
      })
    }, cb)
  }, function (e) {
    console.log('Finished downloading db!')
    setImmediate(cb, e)
  })
}

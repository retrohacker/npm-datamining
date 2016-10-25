var sql = require('sqlite3')
var npmStream = require('concurrent-couch-follower')
var path = require('path')
var fs = require('fs')
var mkdirp = require('mkdirp')


var conf = {
  registry: {
    url: 'https://skimdb.npmjs.com/registry',
    changes: '_changes'
  },
  sequenceFile: path.join(__dirname, '.sequence'),
  changesDir: path.join(__dirname, 'changes')
}

mkdirp.sync(conf.changesDir)

var npmConf = {
  db: `${conf.registry.url}/${conf.registry.changes}`,
  sequence: conf.sequenceFile,
  include_docs: true,
  concurrency: 100
}

var changeKeys = {}
var docKeys = {}
var versionKeys = {}

var count = 0

function onChange (change, done) {
  fs.writeFile(
    path.join(conf.changesDir, `${count}.json`),
    JSON.stringify(change, null, '  '),
    'utf8', done)

  var keys = Object.keys(change)
  for(var i = 0; i < keys.length; i++) {
    changeKeys[keys[i]] = changeKeys[keys[i]] || {}
    changeKeys[keys[i]][typeof change[keys[i]]] = true
  }

  var keys = Object.keys(change.doc)
  for(var i = 0; i < keys.length;i ++) {
    docKeys[keys[i]] = docKeys[keys[i]] || {}
    docKeys[keys[i]][typeof change.doc[keys[i]]] = true
  }

  if(change.doc.versions) keys = Object.keys(change.doc.versions)
  else keys = []
  for(var i = 0; i < keys.length; i++) {
    recurseMapKeys(change.doc.versions[keys[i]], versionKeys)
  }

  if(++count % 100 === 0) console.log(count)
}

function persist () {
  fs.writeFileSync(
    path.join(__dirname,'change.json'),
    JSON.stringify(changeKeys, null, '  '),
    'utf8')
  fs.writeFileSync(
    path.join(__dirname,'doc.json'),
    JSON.stringify(docKeys, null, '  '),
    'utf8')
  fs.writeFileSync(
    path.join(__dirname,'version.json'),
    JSON.stringify(versionKeys, null, '  '),
    'utf8')
  process.exit(2)
}

function recurseMapKeys (object, keyObject) {
  var keys = Object.keys(object)
  for(var i = 0; i < keys.length; i++) {
    keyObject[keys[i]] = keyObject[keys[i]] || {}
    keyObject[keys[i]]['__type'] = keyObject[keys[i]]['__type'] || {}
    keyObject[keys[i]]['__type'][typeof object[keys[i]]] = true
    if(typeof object[keys[i]] === 'object' && object[keys[i]] != undefined) {
      recurseMapKeys(object[keys[i]], keyObject[keys[i]])
    }
  }
}

npmStream(onChange, npmConf)

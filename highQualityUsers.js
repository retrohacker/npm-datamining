/*
 * Get a vast majority of the usernames on npm
 */
var fs = require('fs')
var async = require('async')
var path = require('path')
var parseAuthor = require('parse-author')
var sqlite = require('sqlite3')

var conf = {
  changesDir: path.join(__dirname, 'changes')
}

fs.readdir(conf.changesDir, function (e, files) {
  if(e) throw e
  return async.forEachLimit(files, 100, function (filename, cb) {
    fs.readFile(
      path.join(conf.changesDir, filename),
      'utf8',
      function (e, data) {
        try {
          var change = JSON.parse(data)
        } catch(e) {
          return cb()
        }
        convertObject(change)
        return cb()
      }
    )
  }, function (e) {
    fs.writeFile(
      path.join(__dirname, 'users.json'),
      JSON.stringify(Users, null, '  '),
      'utf8')
  })
})

var Users = {}

function convertObject(change) {
  if(change.id == undefined) return null
  if(change.deleted === true) return null

  var versions =
    change.doc.versions
    ? Object.keys(change.doc.versions)
    : []

  var users = []

  for(var i = 0; i < versions.length; i++) {
    concat(users, change.doc.versions[versions[i]]._npmUser)
  }

  for(var i = 0; i < users.length; i++) {
    var name = users[i].name
    var email = users[i].email
    // Only interested in usernames
    if(name) {
      Users[name] = Users[name] || {}
      if(email) {
        // Start building out known values
        Users[name][email] = true
      }
    }
  }
}

function concat (array, input) {
  if(!input) { return null }
  if(input instanceof Array) {
    for(var i = 0; i < input.length; i++) {
      if(!input[i]) { continue }
      array.push(input[i])
    }
    return null
  }
  array.push(input)
  return null
}

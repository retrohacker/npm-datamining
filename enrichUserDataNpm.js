var users = require('./hq_users.json')
var async = require('async')
var npmUser = require('npm-user')
var fs = require('fs')
var path = require('path')

var usernames = Object.keys(users)

var start = Date.now()
async.forEachLimit(usernames, 5, function (v, cb) {
  async.retry({ times: 10000, interval: 10000 }, function (cb) {
    console.log(`Fetching ${v}`)
    npmUser(v).then(function(data) {
      console.log(`Fetched ${v}`)
      var keys = Object.keys(data)
      for(var i = 0; i < keys.length; i++) {
        if(data[keys[i]]) {
          users[v][keys[i]] = users[v][keys[i]] || {}
          users[v][keys[i]][data[keys[i]]] = true
        }
      }
      cb()
    }).catch(function (e) {
      if(e.message.indexOf('User doesn\'t exist') !== -1) {
        console.log(`Skipping user ${v}`)
        return cb()
      }
      if(e.message.indexOf('Cannot read property') !== -1) {
        console.log(`Skipping user ${v}`)
        return cb()
      }
      console.error(e.message)
      return cb(e)
    })
  }, function () {
    setTimeout(cb, 200)
  })
}, function () {
  fs.writeFile(
    path.join(__dirname, 'npm_enriched_users.json'),
    JSON.stringify(users, null, '  '),
    'utf8', function () {
      console.log(`Finished in ${(Date.now() - start) / 1000} seconds `)
    })
})

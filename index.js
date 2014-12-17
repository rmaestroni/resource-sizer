/**
 * HTTP client to make HEAD requests on the target urls. Follows redirects
 * until 10 iterations.
 */
Client = (function() {
  function Client(urlLib, http, url, iteration) {
    this.http = http
    this.urlLib = urlLib
    var opts = urlLib.parse(url)
    opts.method = 'HEAD'
    opts.agent = false
    this.url = url
    this.options = opts
    this.iteration = undefined != iteration ? iteration : 0
  }

  /*
   * callback is called with err and a result object with keys status and headers
   */
  Client.prototype.doRequest = function(callback) {
    var httpLib = this.http
    var urlLib = this.urlLib
    var iteration = this.iteration
    var req = this.http.request(this.options, function(res) {
      if (-1 != [301, 303, 307, 308].indexOf(res.statusCode)) {
        if (iteration < 10) {
          // follow redirect
          new Client(urlLib, httpLib, res.headers['location'],
            iteration + 1).doRequest(callback)
        }
        else {
          callback('HTTP redirect too deep')
        }
      }
      else {
        callback(null, { status: res.statusCode, headers: res.headers })
      }
      res.on('data', function(chunk) { })
    })
    req.on('error', function(e) { callback(e) })
    req.end()
  }

  /*
   * callback is called with err and a result object with one key size
   */
  Client.prototype.getResourceSize = function(callback) {
    this.doRequest(function(err, result) {
      var size = null
      if (result && result.headers) {
        size = parseInt(result.headers['content-length'])
      }
      callback(err, { size: size })
    })
  }

  return Client
})()


/**
 * Process a client request
 */
Server = (function() {
  function Server(urlLib, httpLib, asyncLib, urls) {
    this.urlLib = urlLib
    this.httpLib = httpLib
    this.async = asyncLib
    if (urls instanceof Array) {
      this.urls = urls
    }
    else {
      this.urls = [urls]
    }
  }

  Server.prototype.processRequest = function(request, response) {
    var urls = this.urls
    this.buildResponse(function(err, results) {
      if (err) {
        response.writeHead(422, { 'Content-Type': 'text/plain' })
        response.write(err.toString())
        response.end()
      }
      else {
        response.writeHead(200, { 'Content-Type': 'application/json' })
        response.write(JSON.stringify({
          'urls': urls,
          'sizes': results
        }))
        response.end()
      }
    })
  }

  Server.prototype.buildResponse = function(doneCallback) {
    var urlLib = this.urlLib
    var http = this.httpLib
    var iterator = function(item, callback) {
      new Client(urlLib, http, item).getResourceSize(function(err, result) {
        callback(err, result.size)
      })
    }
    this.async.map(this.urls, iterator, doneCallback)
  }

  return Server
})()


// Module dependencies.
var http = require('http')
var URL = require('url')
var async = require('async')
var express = require('express')
var bodyParser = require('body-parser')

// Init Express application
var app = express()
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/', function(request, response) {
  var urls = request.query['urls'] || request.query['urls[]'] || []
  new Server(URL, http, async, urls).processRequest(request, response)
})

app.post('/', function(request, response) {
  var urls = request.body['urls'] || request.body['urls[]'] || []
  new Server(URL, http, async, urls).processRequest(request, response)
})

// Get command line options via minimist
var argv = require('minimist')(process.argv.slice(2))

// Run http server
var server = app.listen(argv.port || 8081, function() {
  var host = server.address().address
  var port = server.address().port
  console.log('Server listening at http://%s:%s', host, port)
})

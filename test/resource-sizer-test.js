var assert = require('assert')
var expect = require('expect.js')

require('../index.js')

describe('Client', function() {
  var http = require('http')
  var URL = require('url')

  describe('ctor', function() {
    it('should set some attributes', function() {
      var client = new Client(URL, http, 'http://www.example.com')
      expect(client.urlLib).to.equal(URL)
      expect(client.http).to.equal(http)
      expect(client.url).to.equal('http://www.example.com')
      expect(client.iteration).to.equal(0)
    })

    it('should set the iteration value', function() {
      var client = new Client(URL, http, 'http://www.example.com', 10)
      expect(client.urlLib).to.equal(URL)
      expect(client.http).to.equal(http)
      expect(client.url).to.equal('http://www.example.com')
      expect(client.iteration).to.equal(10)
    })

    it('should parse the url passed', function() {
      var client = new Client(URL, http, 'http://www.example.com')
      options = client.options
      expect(options.method).to.equal('HEAD')
      expect(options.agent).to.not.be.ok()
    })
  }) // ctor


  describe('doRequest', function() {

    describe('redirect limit', function() {
      it('should stop after 10 iterations', function(done) {
        var URL = require('url')
        // stub the http library
        var fakeHttp = {
          request: function(options, callback) {
            var response = {
              statusCode: 303,
              headers: { location: 'http://www.example.com/2' },
              on: function() {}
            }
            callback(response)
            var request = {
              on: function() {},
              end: function() {}
            }
            return request
          }
        } // fakeHttp
        var client = new Client(URL, fakeHttp, 'http://www.example.com')
        client.doRequest(function(err, result) {
          expect(err).to.equal('HTTP redirect too deep')
          done()
        })
      })
    }) // http redirect limit


    it('should be success', function(done) {
      var URL = require('url')
      // stub the http library
      var fakeHttp = {
        request: function(options, callback) {
          var response = {
            statusCode: 200,
            headers: { foo: 'bar' },
            on: function() {}
          }
          callback(response)
          var request = {
            on: function() {},
            end: function() {}
          }
          return request
        }
      } // fakeHttp
      var client = new Client(URL, fakeHttp, 'http://www.example.com')
      client.doRequest(function(err, result) {
        expect(err).to.equal(null)
        expect(result.status).to.equal(200)
        h = result.headers
        expect(h['foo']).to.equal('bar')
        done()
      })
    })

  }) // doRequest


  describe('getResourceSize', function() {
    it('should doRequest and parse the content-length header', function(done) {
      var URL = require('url')
      var client = new Client(URL, {}, 'http://www.example.com')
      // stub method doRequest
      client.doRequest = function(callback) {
        callback(null, { headers: { 'content-length': 1000 } })
      }
      //
      client.getResourceSize(function(err, result) {
        expect(err).to.equal(null)
        expect(result.size).to.equal(1000)
        done()
      })
    })
  }) // getResourceSize

})

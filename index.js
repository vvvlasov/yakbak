// Copyright 2016 Yahoo Inc.
// Licensed under the terms of the MIT license. Please see LICENSE file in the project root for terms.

var Promise = require('bluebird');
var messageHash = require('incoming-message-hash');
var assert = require('assert');
var mkdirp = require('mkdirp');
var path = require('path');
var buffer = require('./lib/buffer');
var proxy = require('./lib/proxy');
var record = require('./lib/record');
var recordPact = require('./lib/recordPact');
var curl = require('./lib/curl');
var debug = require('debug')('yakbak:server');
var fs = require('fs');
var promiseRetry = require('promise-retry');

/**
 * Returns a new yakbak proxy middleware.
 * @param {String} host The hostname to proxy to
 * @param {Object} opts
 * @param {String} opts.dirname The tapes directory
 * @param {Boolean} opts.noRecord if true, requests will return a 404 error if the tape doesn't exist
 * @returns {Function}
 */

module.exports = function (host, opts) {

  function respond(pres, res, body, filename) {

    res.statusCode = pres.statusCode;
    Object.keys(pres.headers).forEach(function (key) {
      res.setHeader(key, pres.headers[key]);
    });
    body.forEach(function (data) {
      res.write(data);
    });
    res.end();
  }

  /**
   * Returns the tape name for `req`.
   * @param {http.IncomingMessage} req
   * @param {Array.<Buffer>} body
   * @returns {String}
   */

  function tapename(req, body) {

    var hash = opts.hash || messageHash.sync;

    return hash(req, Buffer.concat(body));
  }

  assert(opts.dirname, 'You must provide opts.dirname');

  mkdirp.sync(opts.dirname);

  if (opts.mode === 'replayOnly') {
    const responseModules = fs.readdirSync(opts.dirname).map(function (filename) {
      console.log(opts.dirname + '/' + filename);
      return require(opts.dirname + '/' + filename);
    });
    return function (req, res) {
      return buffer(req).then(function (reqbody) {
        var tape = tapename(req, reqbody);
        var mod = responseModules.find(mod => mod.matchesRequest(tape));
        if (mod) {
          return mod.getNext()(req, res);
        } else {
          res.statusCode = 404;
          res.write(new Buffer('{error: \'TapeNotFound\'}'));
          res.end();
        }
      });
    }
  } else {
    return function (req, res) {
      return buffer(req).then(function (reqbody) {
        var tape = tapename(req, reqbody);
        var filename = opts.dirname + '/' + tape + '.js';

        return proxy(req, reqbody, host).then(function (pres) {
          return buffer(pres).then(function (resbody) {
            return record(pres.req, pres, resbody, filename).then(function () {
              return opts.pactFile ? recordPact(req, pres, reqbody, resbody, opts.pactFile) : undefined;
            }).then(function () {
              respond(pres, res, resbody, filename);
              return filename;
            });
          });
        });
      });
    };
  }
};

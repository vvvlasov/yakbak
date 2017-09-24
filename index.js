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
  assert(opts.dirname, 'You must provide opts.dirname');

  var state = "";

  return function (req, res) {

    req.headers['x-yakbak-state'] = state || 'undefined';

    mkdirp.sync(opts.dirname);

    debug('req', req.url);

    return buffer(req)
      .then(body => {

          const currentTape = tapename(req, body);
          const filename = path.join(opts.dirname, currentTape + '.js');

          return promiseRetry(retryFn => {

              console.log(filename);
              console.log(state);

              if (opts.mode === 'replayOnly') {
                if (require(filename).state !== state) {
                  retryFn('Request was out of the order');
                }
              }

              return opts.mode === 'replayOnly' ?
                new Promise(() => {
                  require(filename)(req, res);
                  state = currentTape;
                  return filename;
                }) :
                proxy(req, body, host)
                  .then(pres => record(pres.req, pres, filename, state))
                  .then(() => {
                    require(filename)(req, res);
                    state = currentTape;
                    return filename;
                  });
            },
            {retries: 3, minTimeout: 1000, maxTimeout: 2000});
        }
      );
  };

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

};

/**
 * Bluebird error predicate for matching module not found errors.
 * @param {Error} err
 * @returns {Boolean}
 */

function ModuleNotFoundError(err) {
  return err.code === 'MODULE_NOT_FOUND';
}

/**
 * Error class that is thrown when an unmatched request
 * is encountered in noRecord mode
 * @constructor
 */

function RecordingDisabledError(message) {
  this.message = message;
  this.status = 404;
}

RecordingDisabledError.prototype = Object.create(Error.prototype);

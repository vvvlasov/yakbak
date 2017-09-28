// Copyright 2016 Yahoo Inc.
// Licensed under the terms of the MIT license. Please see LICENSE file in the project root for terms.

var Promise = require('bluebird');
var buffer = require('./buffer');
var path = require('path');
var ejs = require('ejs');
var fs = require('fs');
var debug = require('debug')('yakbak:record');
var url = require('url');

/**
 * Record the http interaction between `req` and `res` to disk as pact file.
 * The format is a vanilla node module that can be used as
 * an http.Server handler.
 * @param {http.ClientRequest} req
 * @param {http.IncomingMessage} res
 * @param {Array} reqbody
 * @param {Array} resbody
 * @param {String} filename
 * @returns {Promise.<String>}
 */

module.exports = function (req, res, reqbody, resbody, filename) {

  function writeJson(json) {
    fs.writeFileSync(filename, JSON.stringify(json, null, 2));
  }

  if (!fs.existsSync(filename)) {
    writeJson({
      consumer: {name: path.parse(filename).name.split('-')[0]},
      provider: {name: path.parse(filename).name.split('-')[1]},
      interactions: []
    });
  }
  const pactJson = JSON.parse(fs.readFileSync(filename));
  pactJson.interactions.push({
    description: `${req.method} ${req.url} ${
      pactJson.interactions.filter(int => int.description.indexOf(`${req.method} ${req.url}`) !== -1).length}`,
    request: {
      method: req.method,
      path: url.parse(req.url).pathname,
      query: url.parse(req.url).query
    },
    response: {
      status: res.statusCode
    }
  })
  writeJson(pactJson)
};


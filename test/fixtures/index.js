// Copyright 2016 Yahoo Inc.
// Licensed under the terms of the MIT license. Please see LICENSE file in the project root for terms.

var semver = require('semver');
var path = require('path');
var fs = require('fs');

function read(file) {
  return fs.readFileSync(path.join(__dirname, file + '.js'), 'utf8');
}

/**
 * node >= 1.5.0 sends the content-length whenever possible
 * @see https://github.com/nodejs/node/pull/1062
 */

module.exports = read('v3.0.0');

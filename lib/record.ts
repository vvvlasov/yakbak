// Copyright 2016 Yahoo Inc.
// Licensed under the terms of the MIT license. Please see LICENSE file in the project root for terms.

import * as Promise from 'bluebird';
import * as http from 'http';
import {yakbak} from '../index';
import * as path from 'path';
import * as ejs from 'ejs';
import * as fs from 'fs';

const debug = require('debug')('yakbak:record');

/**
 * Read and pre-compile the tape template.
 * @type {Function}
 * @private
 */

const renderTape = ejs.compile(fs.readFileSync(path.resolve(__dirname, '../src/tape.ejs'), 'utf8'));
const renderResponse = ejs.compile(fs.readFileSync(path.resolve(__dirname, '../src/response.ejs'), 'utf8'));

/**
 * Record the http interaction between `req` and `res` to disk.
 * The format is a vanilla node module that can be used as
 * an http.Server handler.
 * @param {http.ClientRequest} req
 * @param {http.IncomingMessage} res
 * @param {String} filename
 * @returns {Promise.<String>}
 */

export default (req: http.ClientRequest, res: http.IncomingMessage, body: Array<Buffer>, filename: string, matchers: Array<yakbak.RequestMatcher>) => {
  return new Promise((resolve) => {
    if (!fs.existsSync(filename)) {
      resolve(write(filename, renderTape({fns: matchers.map((match: yakbak.RequestMatcher) => match.stringified)})));
    }
    resolve();
  }).then(() => {
    return append(filename, renderResponse({req: req, res: res, body: body}));
  });
};

/**
 * Write `data` to `filename`. Seems overkill to 'promisify' this.
 * @param {String} filename
 * @param {String} data
 * @returns {Promise}
 */

function write(filename: string, data: string): string {
  debug('write', filename);
  fs.writeFileSync(filename, data);
  return filename;
}

function append(filename: string, data: string): string {
  debug('append', filename);
  fs.appendFileSync(filename, data);
  return filename;
}

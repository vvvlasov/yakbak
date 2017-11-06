// Copyright 2016 Yahoo Inc.
// Licensed under the terms of the MIT license. Please see LICENSE file in the project root for terms.

const tmpdir = require('os-tmpdir');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');
import * as path from 'path';

/**
 * Creates a temporary directory for use in tests.
 * @param {Function} done
 * @returns {Object}
 */

export function createTmpdir(done: Function) {
  return new Dir().setup(done);
};

export class Dir {

  dirname: string;

  constructor() {
    this.dirname = path.join(tmpdir(), String(Date.now()));
  }

  join = function (val: string) {
    return path.join(this.dirname, val);
  };


  setup = function (done: Function) {
    mkdirp(this.dirname, done);
    return this;
  };

  teardown = function (done: Function) {
    rimraf(this.dirname, done);
    return this;
  };
}

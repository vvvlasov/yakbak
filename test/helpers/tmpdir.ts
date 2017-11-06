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

export function createTmpdir(done: Function): Dir {
  return new Dir().setup(done);
}

export class Dir {

  dirname: string;

  constructor() {
    this.dirname = path.join(tmpdir(), String(Date.now()));
  }

  join(val: string): string {
    return path.join(this.dirname, val);
  }

  setup(done: Function): Dir {
    mkdirp(this.dirname, done);
    return this;
  }

  teardown(done: Function): Dir {
    rimraf(this.dirname, done);
    return this;
  }
}

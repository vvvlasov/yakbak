// Copyright 2016 Yahoo Inc.
// Licensed under the terms of the MIT license. Please see LICENSE file in the project root for terms.

/* eslint-env mocha */

import {methodMatcher} from '../lib/matchers';
import {yakbak} from '../index';
import subject from '../lib/record';
import {Dir, createTmpdir} from './helpers/tmpdir';
const assert = require('assert');
import * as http from 'http';
const fs = require('fs');
import 'mocha';
import createServer, {TestServer} from "./helpers/server";

import fixture from './fixtures';

describe('record', function () {
  let server: TestServer, tmpdir: Dir, req: http.ClientRequest;
  const reqMatchers: yakbak.RequestMatcher[] = [methodMatcher('GET')];

  beforeEach(function (done: Function) {
    server = createServer(done);
  });

  afterEach(function (done: Function) {
    server.teardown(done);
  });

  beforeEach(function (done: Function) {
    tmpdir = createTmpdir(done);
  });

  afterEach(function (done: Function) {
    tmpdir.teardown(done);
  });

  beforeEach(function () {
    req = http.request({
      method: 'GET',
      host: server.addr,
      port: server.port,
      path: '/request/path/1'
    });
    req.setHeader('User-Agent', 'My User Agent/1.0');
    req.setHeader('Connection', 'close');
  });

  it('returns the filename', function (done: Function) {
    req.on('response', function (res) {
      subject(req, res, [new Buffer('')], tmpdir.join('foo.js'), reqMatchers).then(function (filename: string) {
        assert.equal(filename, tmpdir.join('foo.js'));
        done();
      }).catch(function (err: Error) {
        done(err);
      });
    });

    req.end();
  });

  it('records the response to disk', function (done: Function) {
    const expected = fixture.replace('{addr}', server.addr).replace('{port}', server.port);
    req.on('response', function (res) {
      subject(req, res, [new Buffer('')], tmpdir.join('foo.js'), reqMatchers).then(function (filename: string) {
        assert.equal(fs.readFileSync(filename, 'utf8'), expected);
        done();
      }).catch(function (err: Error) {
        done(err);
      });
    });

    req.end();
  });

});

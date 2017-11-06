// Copyright 2016 Yahoo Inc.
// Licensed under the terms of the MIT license. Please see LICENSE file in the project root for terms.

/* eslint-env mocha */

import {makeExactMatcher} from '../lib/matchers';
import {yakbak} from '../index';
import subject from '../lib/record';
import {createTmpdir, Dir} from './helpers/tmpdir';
import * as assert from 'assert';
import * as http from 'http';
import * as fs from 'fs';
import 'mocha';
import createServer, {TestServer} from './helpers/server';

import fixture from './fixtures';

describe('record', () => {
  let server: TestServer, tmpdir: Dir, req: http.ClientRequest, reqMatchers: Array<yakbak.RequestMatcher>;

  beforeEach((done: Function) => {
    server = createServer(done);
  });

  afterEach((done: Function) => {
    server.teardown(done);
  });

  beforeEach((done: Function) => {
    tmpdir = createTmpdir(done);
  });

  afterEach((done: Function) => {
    tmpdir.teardown(done);
  });

  beforeEach(() => {
    req = http.request({
      method: 'GET',
      host: server.addr,
      port: server.port,
      path: '/request/path/1'
    }, (inc: http.IncomingMessage) => {
      reqMatchers = makeExactMatcher({method: 'GET', url: '/request/path/1'} as http.IncomingMessage & {body?: {}});
    });
    req.setHeader('User-Agent', 'My User Agent/1.0');
    req.setHeader('Connection', 'close');
  });

  it('returns the filename', (done: Function) => {
    req.on('response', (res) => {
      subject(req, res, [new Buffer('')], tmpdir.join('foo.js'), reqMatchers).then((filename: string) => {
        assert.equal(filename, tmpdir.join('foo.js'));
        done();
      }).catch((err: Error) => {
        done(err);
      });
    });

    req.end();
  });

  it('records the response to disk', (done: Function) => {
    const expected = fixture.replace('{addr}', server.addr).replace('{port}', server.port);
    req.on('response', (res) => {
      subject(req, res, [new Buffer('')], tmpdir.join('foo.js'), reqMatchers).then((filename: string) => {
        assert.equal(fs.readFileSync(filename, 'utf8'), expected);
        done();
      }).catch((err: Error) => {
        done(err);
      });
    });

    req.end();
  });

});

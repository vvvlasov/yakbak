// Copyright 2016 Yahoo Inc.
// Licensed under the terms of the MIT license. Please see LICENSE file in the project root for terms.

/* eslint-env mocha */

import subject from '../lib/proxy';
import createServer, {TestServer} from './helpers/server';
import * as assert from 'assert';
import * as http from 'http';
import 'mocha';

describe('proxy', function () {
  let server: TestServer, req: http.IncomingMessage;

  beforeEach(function (done: Function) {
    server = createServer(done);
  });

  afterEach(function (done: Function) {
    server.teardown(done);
  });

  beforeEach(function () {
    req = new http.IncomingMessage(null);
    req.method = 'GET';
    req.url = '/';
    req.headers['connection'] = 'close';
  });

  it('proxies the request', function (done: Function) {
    server.once('request', function (preq: http.IncomingMessage) {
      assert.equal(preq.method, req.method);
      assert.equal(preq.url, req.url);
      assert.equal(preq.headers.host, server.addr + ':' + server.port);
      done();
    });

    subject(req, [], server.host).catch(function (err: Error) {
      done(err);
    });
  });

  it('proxies the request body', function (done: Function) {
    var body = [
      new Buffer('a'),
      new Buffer('b'),
      new Buffer('c')
    ];

    server.once('request', function (_req) {
      var data: Buffer[] = [];

      _req.on('data', function (buf: Buffer) {
        data.push(buf);
      });

      _req.on('end', function () {
        assert.deepEqual(Buffer.concat(data), Buffer.concat(body));
        done();
      });
    });

    req.method = 'POST';

    subject(req, body, server.host).catch(function (err: Error) {
      done(err);
    });
  });

  it('yields the response', function (done: Function) {
    subject(req, [], server.host).then(function (res: http.IncomingMessage) {
      assert.equal(res.statusCode, 201);
      done();
    }).catch(function (err: Error) {
      done(err);
    });
  });

});

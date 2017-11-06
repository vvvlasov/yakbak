// Copyright 2016 Yahoo Inc.
// Licensed under the terms of the MIT license. Please see LICENSE file in the project root for terms.

/* eslint-env mocha */

import subject from '../lib/proxy';
import createServer, {TestServer} from './helpers/server';
import * as assert from 'assert';
import * as http from 'http';
import 'mocha';

describe('proxy', () => {
  let server: TestServer, req: http.IncomingMessage;

  beforeEach((done: Function) => {
    server = createServer(done);
  });

  afterEach((done: Function) => {
    server.teardown(done);
  });

  beforeEach(() => {
    req = new http.IncomingMessage(null);
    req.method = 'GET';
    req.url = '/';
    req.headers['connection'] = 'close';
  });

  it('proxies the request', (done: Function) => {
    server.once('request', (preq: http.IncomingMessage) => {
      assert.equal(preq.method, req.method);
      assert.equal(preq.url, req.url);
      assert.equal(preq.headers.host, server.addr + ':' + server.port);
      done();
    });

    subject(req, [], server.host).catch((err: Error) => {
      done(err);
    });
  });

  it('proxies the request body', (done: Function) => {
    const body = [
      new Buffer('a'),
      new Buffer('b'),
      new Buffer('c')
    ];

    server.once('request', (_req) => {
      const data: Array<Buffer> = [];

      _req.on('data', (buf: Buffer) => {
        data.push(buf);
      });

      _req.on('end', () => {
        assert.deepEqual(Buffer.concat(data), Buffer.concat(body));
        done();
      });
    });

    req.method = 'POST';

    subject(req, body, server.host).catch((err: Error) => {
      done(err);
    });
  });

  it('yields the response', (done: Function) => {
    subject(req, [], server.host).then((res: http.IncomingMessage) => {
      assert.equal(res.statusCode, 201);
      done();
    }).catch((err: Error) => {
      done(err);
    });
  });

});

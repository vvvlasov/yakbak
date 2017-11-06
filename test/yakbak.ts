// Copyright 2016 Yahoo Inc.
// Licensed under the terms of the MIT license. Please see LICENSE file in the project root for terms.

/* eslint-env mocha */

import subject, {yakbak} from '../index';
import createServer, {TestServer} from './helpers/server';
import {createTmpdir, Dir} from './helpers/tmpdir';
import 'mocha';
import * as http from 'http';
import * as  assert from 'assert';
import * as request from 'supertest';
import {CallbackHandler} from 'supertest';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as url from 'url';
import {methodMatcher} from '../lib/matchers';

describe('yakbak', () => {
  let server: TestServer, tmpdir: Dir, yb: Function;

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

  describe('record', () => {
    describe('when recording is enabled', () => {
      beforeEach(() => {
        yb = subject(server.host, {dirname: tmpdir.dirname}, [[methodMatcher('GET')]]);
      });

      it('proxies the request to the server', (done: Function) => {
        request(yb)
          .post('/record/1')
          .set('host', 'localhost:3001')
          .set('content-type', 'application/json')
          .send({body: {prop: 1}})
          .expect('Content-Type', 'text/html')
          .expect(201, 'OK')
          .end((err: Error) => {
            assert.ifError(err);
            assert.equal(server.requests.length, 1);
            done();
          });
      });

      it('writes the tape to disk', (done: Function) => {
        request(yb)
          .post('/record/2')
          .set('host', 'localhost:3001')
          .set('content-type', 'application/json')
          .send({body: {prop: 1}})
          .expect('Content-Type', 'text/html')
          .expect(201, 'OK')
          .end((err: Error) => {
            assert.ifError(err);
            assert(fs.existsSync(tmpdir.join('b8ad74d97e98a0efe9b1a37a1b097ae0.js')));
            done();
          });
      });

      describe('when given a custom hashing function', () => {
        beforeEach(() => {
          // customHash creates a MD5 of the request, ignoring its querystring, headers, etc.
          const customHash = (req: http.IncomingMessage, body: Buffer) => {
            const hash = crypto.createHash('md5');
            const parts = url.parse(req.url, true);

            hash.update(req.method);
            hash.update(parts.pathname);
            hash.write(body);

            return hash.digest('hex');
          };

          yb = subject(server.host, {dirname: tmpdir.dirname, hash: customHash});
        });

        it('uses the custom hash to create the tape name', (done: Function) => {
          request(yb)
            .get('/record/1')
            .query({foo: 'bar'})
            .query({date: new Date()}) // without the custom hash, this would always cause 404s
            .set('host', 'localhost:3001')
            .expect('Content-Type', 'text/html')
            .expect(201, 'OK')
            .end((err: Error) => {
              assert.ifError(err);
              assert(fs.existsSync(tmpdir.join('3f142e515cb24d1af9e51e6869bf666f.js')));
              done();
            });
        });
      });
    });

    describe('when recording is not enabled', () => {
      beforeEach(() => {
        yb = subject(server.host, {dirname: tmpdir.dirname, mode: 'replayOnly'});
      });

      it('returns a 404 error', (done: Function) => {
        request(yb)
          .get('/record/2')
          .set('host', 'localhost:3001')
          .expect(404)
          .end(done as CallbackHandler);
      });

      it('does not make a request to the server', (done: Function) => {
        request(yb)
          .get('/record/2')
          .set('host', 'localhost:3001')
          .end((err: Error) => {
            assert.ifError(err);
            assert.equal(server.requests.length, 0);
            done();
          });
      });

      it('does not write the tape to disk', (done: Function) => {
        request(yb)
          .get('/record/2')
          .set('host', 'localhost:3001')
          .end((err: Error) => {
            assert.ifError(err);
            assert(!fs.existsSync(tmpdir.join('3234ee470c8605a1837e08f218494326.js')));
            done();
          });
      });
    });
  });

  describe('playback', () => {

    beforeEach((done: Function) => {
      const file = '305c77b0a3ad7632e51c717408d8be0f.js';
      const tape = [
        'const path = require("path");',
        'const responseArray = [];',
        'var callIndex = 0;',
        'function getNext() {',
        'const fn = responseArray[callIndex];',
        'callIndex += 1;',
        'return fn;',
        '}',
        'function matchesRequest(req) {\n' +
        '  return [function (req) {\n' +
        '    return req.method === \'POST\';\n' +
        '  }, function (req) {\n' +
        '    return req.url === \'/playback/1\'\n' +
        '  }, function (req) {\n' +
        '    return req.body.body.prop === 1;\n' +
        '  }].reduce((res, fn) => res && fn(req), true);\n' +
        '}',
        'module.exports = {getNext: getNext, matchesRequest: matchesRequest};',
        'responseArray.push(function (req, res) {',
        '  res.statusCode = 201;',
        '  res.setHeader("content-type", "text/html")',
        '  res.setHeader("x-yakbak-tape", path.basename("305c77b0a3ad7632e51c717408d8be0f"));',
        '  res.end("YAY");',
        '})',
        ''
      ].join('\n');

      fs.writeFile(tmpdir.join(file), tape, () => {
        yb = subject(server.address().address, {dirname: tmpdir.dirname, mode: 'replayOnly'});
        done();
      });
    });

    it('does not make a request to the server', (done: Function) => {
      request(yb)
        .post('/playback/1')
        .set('host', 'localhost:3001')
        .set('content-type', 'application/json')
        .send({body: {prop: 1}})
        .expect('Content-Type', 'text/html')
        .expect(201, 'YAY')
        .end((err: Error) => {
          assert.ifError(err);
          assert.equal(server.requests.length, 0);
          done();
        });
    });
  });
});

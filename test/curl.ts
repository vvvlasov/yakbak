// Copyright 2016 Yahoo Inc.
// Licensed under the terms of the MIT license. Please see LICENSE file in the project root for terms.

/* eslint-env mocha */

import * as subject from '../lib/curl';
import * as assert from 'assert';
import * as http from 'http';
import 'mocha';

describe('curl', () => {

  it('formats an http.IncomingRequest', () => {
    const req = new http.IncomingMessage(null);
    req.httpVersion = '1.1';
    req.method = 'GET';
    req.url = 'https://www.flickr.com';
    req.headers['host'] = 'www.flickr.com';

    assert.deepEqual(subject.request(req),
      '< GET https://www.flickr.com HTTP/1.1\n' +
      '< host: www.flickr.com\n' +
      '<'
    );
  });

  it('formats an http.ServerResponse', () => {
    const req = new http.IncomingMessage(null);
    req.httpVersion = '1.1';

    const res = new http.ServerResponse(req);
    res.statusCode = 200;
    res.setHeader('date', 'Wed, 22 Jun 2016 22:02:31 GMT');

    assert.deepEqual(subject.response(req, res),
      '> HTTP/1.1 200 OK\n' +
      '> date: Wed, 22 Jun 2016 22:02:31 GMT\n' +
      '>'
    );
  });

});

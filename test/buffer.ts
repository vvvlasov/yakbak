// Copyright 2016 Yahoo Inc.
// Licensed under the terms of the MIT license. Please see LICENSE file in the project root for terms.

/* eslint-env mocha */

var subject = require('../out/lib/buffer').default;
var stream = require('stream');
var assert = require('assert');
import 'mocha';

describe('buffer', function () {

  it('yields the stream contents', function (done) {
    var str = new stream.PassThrough;

    subject(str).then(function (body: {}) {
      assert.deepEqual(body, [
        new Buffer('a'),
        new Buffer('b'),
        new Buffer('c')
      ]);
      done();
    }).catch(function (err: Error) {
      done(err);
    });

    str.write('a');
    str.write('b');
    str.write('c');
    str.end();
  });

  it('yields an error', function (done: Function) {
    var str = new stream.PassThrough;

    subject(str).then(function () {
      done(new Error('should have yielded an error'));
    }).catch(function (err: Error) {
      assert.equal(err.message, 'boom');
      done();
    });

    str.emit('error', new Error('boom'));
  });

});

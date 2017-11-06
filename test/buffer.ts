// Copyright 2016 Yahoo Inc.
// Licensed under the terms of the MIT license. Please see LICENSE file in the project root for terms.

/* eslint-env mocha */

import subject from '../lib/buffer';
import * as stream from 'stream';
import * as assert from 'assert';
import 'mocha';

describe('buffer', () => {

  it('yields the stream contents', (done) => {
    const str = new stream.PassThrough;

    subject(str).then((body: {}) => {
      assert.deepEqual(body, [
        new Buffer('a'),
        new Buffer('b'),
        new Buffer('c')
      ]);
      done();
    }).catch((err: Error) => {
      done(err);
    });

    str.write('a');
    str.write('b');
    str.write('c');
    str.end();
  });

  it('yields an error', (done: Function) => {
    const str = new stream.PassThrough;

    subject(str).then(() => {
      done(new Error('should have yielded an error'));
    }).catch((err: Error) => {
      assert.equal(err.message, 'boom');
      done();
    });

    str.emit('error', new Error('boom'));
  });

});

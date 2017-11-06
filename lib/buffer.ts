// Copyright 2016 Yahoo Inc.
// Licensed under the terms of the MIT license. Please see LICENSE file in the project root for terms.

import * as Promise from 'bluebird';
import {Readable} from 'stream';

/**
 * Collect `stream`'s data in to an array of Buffers.
 * @param {stream.Readable} stream
 * @returns {Promise.<Array>}
 */

export default (stream: Readable) => {
  return new Promise((resolve, reject) => {
    const data: Array<Buffer> = [];

    stream.on('data', (buf: Buffer) => {
      data.push(buf);
    });

    stream.on('error', (err: Error) => {
      reject(err);
    });

    stream.on('end', () => {
      resolve(data);
    });
  });
};

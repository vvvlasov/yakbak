// Copyright 2016 Yahoo Inc.
// Licensed under the terms of the MIT license. Please see LICENSE file in the project root for terms.

import * as Promise from 'bluebird';
import {Readable} from 'stream';

/**
 * Collect `stream`'s data in to an array of Buffers.
 * @param {stream.Readable} stream
 * @returns {Promise.<Array>}
 */

export default function (stream: Readable) {
  return new Promise(function (resolve, reject) {
    let data: Buffer[] = [];

    stream.on('data', function (buf: Buffer) {
      data.push(buf);
    });

    stream.on('error', function (err: Error) {
      reject(err);
    });

    stream.on('end', function () {
      resolve(data);
    });
  });
};

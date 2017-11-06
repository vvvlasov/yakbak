// Copyright 2016 Yahoo Inc.
// Licensed under the terms of the MIT license. Please see LICENSE file in the project root for terms.

import * as path from 'path';
import * as fs from 'fs';

function read(file: string): string {
  return fs.readFileSync(path.join(__dirname, file + '.js'), 'utf8').toString();
}

/**
 * node >= 1.5.0 sends the content-length whenever possible
 * @see https://github.com/nodejs/node/pull/1062
 */

const fixture = read('v3.0.0');
export default fixture;

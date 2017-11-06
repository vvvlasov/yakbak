// Copyright 2016 Yahoo Inc.
// Licensed under the terms of the MIT license. Please see LICENSE file in the project root for terms.

import * as Promise from 'bluebird';
import * as https from 'https';
import * as http from 'http';
import * as url from 'url';
const debug = require('debug')('yakbak:proxy');

/**
 * Protocol to module map, natch.
 * @private
 */

const mods: any = { 'http:': http, 'https:': https };

/**
 * Proxy `req` to `host` and yield the response.
 * @param {http.IncomingMessage} req
 * @param {Array.<Buffer>} body
 * @param {String} host
 * @returns {Promise.<http.IncomingMessage>}
 */

export default function (req: http.IncomingMessage, body: Buffer[], host: string): Promise<http.IncomingMessage> {
  return new Promise<http.IncomingMessage & {req: http.ClientRequest}>(function (resolve) {
    const uri: url.Url = url.parse(host);
    const mod = mods[uri.protocol] || http;
    const preq: http.ClientRequest = mod.request({
      hostname: uri.hostname,
      port: uri.port,
      method: req.method,
      path: req.url,
      headers: req.headers,

      servername: uri.hostname,
      rejectUnauthorized: false
    }, function (pres: http.IncomingMessage & {req: http.ClientRequest}) {
      resolve(pres);
    });

    preq.setHeader('Host', uri.host);

    debug('req', req.url, 'host', uri.host);

    body.forEach(function (buf) {
      preq.write(buf);
    });

    preq.end();
  });
};

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

const mods: any = {'http:': http, 'https:': https};

/**
 * Proxy `req` to `host` and yield the response.
 * @param {http.IncomingMessage} reqToProxy
 * @param {Array.<Buffer>} bodyToProxy
 * @param {String} host
 * @returns {Promise.<http.IncomingMessage>}
 */

export default function (reqToProxy: http.IncomingMessage, bodyToProxy: Array<Buffer>, host: string): Promise<http.IncomingMessage> {
  return new Promise<http.IncomingMessage & {req: http.ClientRequest}>((resolve) => {
    const uri: url.Url = url.parse(host);
    const mod = mods[uri.protocol] || http;
    const preq: http.ClientRequest = mod.request({
      hostname: uri.hostname,
      port: uri.port,
      method: reqToProxy.method,
      path: reqToProxy.url,
      headers: reqToProxy.headers,

      servername: uri.hostname,
      rejectUnauthorized: false
    }, (proxiedResponse: http.IncomingMessage & {req: http.ClientRequest}) => {
      resolve(proxiedResponse);
    });

    preq.setHeader('Host', uri.host);

    debug('req', reqToProxy.url, 'host', uri.host);

    bodyToProxy.forEach((buf: Buffer) => {
      preq.write(buf);
    });

    preq.end();
  });
}

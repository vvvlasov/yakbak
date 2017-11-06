// Copyright 2016 Yahoo Inc.
// Licensed under the terms of the MIT license. Please see LICENSE file in the project root for terms.

import * as Promise from 'bluebird';
import {ClientRequest, IncomingMessage} from "http";
import {Url} from "url";
const https = require('https');
const http = require('http');
const url = require('url');
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

export default function (req: IncomingMessage, body: Buffer[], host: string): Promise<IncomingMessage> {
  return new Promise<IncomingMessage & {req: ClientRequest}>(function (resolve) {
    const uri: Url = url.parse(host);
    const mod = mods[uri.protocol] || http;
    const preq: ClientRequest = mod.request({
      hostname: uri.hostname,
      port: uri.port,
      method: req.method,
      path: req.url,
      headers: req.headers,

      servername: uri.hostname,
      rejectUnauthorized: false
    }, function (pres: IncomingMessage & {req: ClientRequest}) {
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

// Copyright 2016 Yahoo Inc.
// Licensed under the terms of the MIT license. Please see LICENSE file in the project root for terms.

import * as http from 'http';
import * as assert from 'assert';
import buffer from './lib/buffer';
import proxy from './lib/proxy';
import record from './lib/record';
import recordPact from './lib/recordPact';
import * as matchersLib from './lib/matchers';
import * as fs from 'fs';
import Bluebird = require('bluebird');

const messageHash = require('incoming-message-hash');
const mkdirp = require('mkdirp');
const debug = require('debug')('yakbak:server');

/**
 * Returns a new yakbak proxy middleware.
 * @param {String} host The hostname to proxy to
 * @param {Object} opts
 * @param {String} opts.dirname The tapes directory
 * @param {Boolean} opts.noRecord if true, requests will return a 404 error if the tape doesn't exist
 * @returns {Function}
 */

export default function (host: string,
  opts: yakbak.YakbakOptions,
  matchersList: Array<Array<yakbak.RequestMatcher>> = [[]]): (req: http.IncomingMessage, res: http.ServerResponse) => Bluebird<string> {

  function respond(pres: http.IncomingMessage, res: http.ServerResponse, body: Array<Buffer>): void {
    res.statusCode = pres.statusCode;
    Object.keys(pres.headers).forEach(function (key): void {
      res.setHeader(key, pres.headers[key]);
    });
    body.forEach(function (data: Buffer): void {
      res.write(data);
    });
    res.end();
  }

  /**
   * Returns the tape name for `req`.
   * @param {http.IncomingMessage} req
   * @param {Array.<Buffer>} body
   * @returns {String}
   */

  function tapename(req: http.IncomingMessage, body: Array<Buffer>): string {
    const hash = opts.hash || messageHash.sync;
    return hash(req, Buffer.concat(body));
  }

  assert(opts.dirname, 'You must provide opts.dirname');

  mkdirp.sync(opts.dirname);

  if (opts.mode === 'replayOnly') {
    const responseModules: Array<yakbak.Tape> = fs.readdirSync(opts.dirname)
      .map(function (filename: string): yakbak.Tape {
        return require(opts.dirname + '/' + filename);
      });
    return (yakReq: http.IncomingMessage, yakRes: http.ServerResponse) => {
      return buffer(yakReq).then((yakReqBody: Array<Buffer>) => {
        const reqWBody: http.IncomingMessage & {body?: {}} = yakReq;
        if (yakReqBody.length > 0 && yakReq.headers['content-type'] === 'application/json') {
          reqWBody.body = JSON.parse(Buffer.concat(yakReqBody).toString());
        }
        const mod = responseModules.find((respMod) => respMod.matchesRequest(reqWBody));
        if (mod) {
          return mod.getNext()(yakReq, yakRes);
        } else {
          yakRes.statusCode = 404;
          yakRes.write(new Buffer('{error: \'TapeNotFound\'}'));
          yakRes.end();
        }
      });
    };
  } else {
    return (yakReq: http.IncomingMessage, yakRes: http.ServerResponse) => {
      return buffer(yakReq).then((yakReqBody: Array<Buffer>) => {
        const tape = tapename(yakReq, yakReqBody);
        const filename = opts.dirname + '/' + tape + '.js';

        return proxy(yakReq, yakReqBody, host).then((proxiedResponse: http.IncomingMessage & {req: http.ClientRequest}) => {
          return buffer(proxiedResponse).then((proxiedBody: Array<Buffer>) => {
            const reqWBody: http.IncomingMessage & {body?: {}} = yakReq;
            if (yakReqBody.length > 0 && proxiedResponse.headers['content-type'] === 'application/json') {
              reqWBody.body = JSON.parse(Buffer.concat(yakReqBody).toString());
            }
            const matching = matchersList.find(
              (reqMatchers: Array<yakbak.RequestMatcher>) => reqMatchers.reduce((isMatching, matcher) => isMatching && matcher.match(yakReq), true)
            ) || [];
            const matchers = matching.length > 0 ? matching : matchersLib.makeExactMatcher(yakReq);
            return record(proxiedResponse.req, proxiedResponse, proxiedBody, filename, matchers).then(() => {
              if (opts.pactFilePath) {
                recordPact(yakReq, proxiedResponse, yakReqBody, proxiedBody, opts.pactFilePath);
              }
              respond(proxiedResponse, yakRes, proxiedBody);
              return filename;
            });
          });
        });
      });
    };
  }
}

export namespace yakbak {
  export interface YakbakOptions {
    readonly dirname: string;
    readonly hash?: Function;
    readonly mode?: string;
    readonly pactFilePath?: string;
  }

  export interface RequestMatcher {
    readonly match: (req: http.IncomingMessage & {body?: {}}) => boolean;
    readonly stringified: string;
  }

  export interface Tape {
    readonly matchesRequest: (req: http.IncomingMessage) => boolean;
    readonly getNext: () => (req: http.IncomingMessage, res: http.ServerResponse) => string;
  }
}

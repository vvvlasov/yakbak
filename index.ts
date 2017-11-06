// Copyright 2016 Yahoo Inc.
// Licensed under the terms of the MIT license. Please see LICENSE file in the project root for terms.

import {ClientRequest, IncomingMessage, ServerResponse} from 'http';
import * as assert from 'assert';
import buffer from './lib/buffer';
import proxy from './lib/proxy';
import record from './lib/record';
import recordPact from './lib/recordPact';
import * as matchersLib from './lib/matchers';
import * as fs from 'fs';

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

export default function (host: string, opts: yakbak.YakbakOptions, matchersList: Array<Array<yakbak.RequestMatcher>> = [[]]) {

  function respond(pres: IncomingMessage, res: ServerResponse, body: Buffer[], filename: string): void {
    res.statusCode = pres.statusCode;
    Object.keys(pres.headers).forEach(function (key) {
      res.setHeader(key, pres.headers[key]);
    });
    body.forEach(function (data: Buffer) {
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

  function tapename(req: IncomingMessage, body: Buffer[]) {
    const hash = opts.hash || messageHash.sync;
    return hash(req, Buffer.concat(body));
  }

  assert(opts.dirname, 'You must provide opts.dirname');

  mkdirp.sync(opts.dirname);

  if (opts.mode === 'replayOnly') {
    const responseModules: yakbak.Tape[] = fs.readdirSync(opts.dirname).map(function (filename: string) {
      return require(opts.dirname + '/' + filename);
    });
    return function (req: IncomingMessage, res: ServerResponse) {
      return buffer(req).then(function (reqbody: Buffer[]) {
        const mod = responseModules.find(mod => mod.matchesRequest(req));
        if (mod) {
          return mod.getNext()(req, res);
        } else {
          res.statusCode = 404;
          res.write(new Buffer('{error: \'TapeNotFound\'}'));
          res.end();
        }
      });
    }
  } else {
    return function (req: IncomingMessage, res: ServerResponse) {
      return buffer(req).then(function (reqbody: Buffer[]) {
        const tape = tapename(req, reqbody);
        const filename = opts.dirname + '/' + tape + '.js';

        return proxy(req, reqbody, host).then(function (pres: IncomingMessage & {req: ClientRequest}) {
          return buffer(pres).then(function (resbody: Buffer[]) {
            const matching = matchersList.find(
              (matchers) => matchers.reduce((isMatching, matcher) => isMatching && matcher.match(req), true)
            );
            const matchers = matching.length > 0 ? matching : matchersLib.makeExactMatcher(req, reqbody);
            return record(pres.req, pres, resbody, filename, matchers).then(function () {
              return opts.pactFilePath ? recordPact(req, pres, reqbody, resbody, opts.pactFilePath) : undefined;
            }).then(function () {
              respond(pres, res, resbody, filename);
              return filename;
            });
          });
        });
      });
    };
  }
};

export namespace yakbak {
  export interface YakbakOptions {
    readonly dirname: string;
    readonly hash?: Function;
    readonly mode?: string;
    readonly pactFilePath?: string;
  }

  export interface RequestMatcher {
    readonly match: (req: IncomingMessage) => boolean;
    readonly getString: () => string;
  }

  export interface Tape {
    readonly matchesRequest: (req: IncomingMessage) => boolean;
    readonly getNext: () => (req: IncomingMessage, res: ServerResponse) => string
  }
}
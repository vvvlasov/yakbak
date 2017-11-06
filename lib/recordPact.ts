// Copyright 2016 Yahoo Inc.
// Licensed under the terms of the MIT license. Please see LICENSE file in the project root for terms.

import {IncomingMessage, ServerResponse} from "http";
import * as fs from 'fs';
import * as url from 'url';
import * as path from 'path';

/**
 * Record the http interaction between `req` and `res` to disk as pact file.
 * The format is a vanilla node module that can be used as
 * an http.Server handler.
 * @param {http.ClientRequest} req
 * @param {http.IncomingMessage} res
 * @param {Array} reqbody
 * @param {Array} resbody
 * @param {String} filename
 * @returns {Promise.<String>}
 */

export default function (req: IncomingMessage, res: IncomingMessage, reqbody: Buffer[], resbody: Buffer[], filename: string) {

  function writeJson(json: any) {
    fs.writeFileSync(filename, JSON.stringify(json, null, 2));
  }

  if (!fs.existsSync(filename)) {
    writeJson({
      consumer: {name: path.parse(filename).name.split('-')[0]},
      provider: {name: path.parse(filename).name.split('-')[1]},
      interactions: []
    });
  }
  const pactJson: any = JSON.parse(fs.readFileSync(filename).toString());
  pactJson.interactions.push({
    description: `${req.method} ${req.url} ${
      pactJson.interactions.filter((int: any) => int.description.indexOf(`${req.method} ${req.url}`) !== -1).length}`,
    request: {
      method: req.method,
      path: url.parse(req.url).pathname,
      query: url.parse(req.url).query
    },
    response: {
      status: res.statusCode
    }
  })
  writeJson(pactJson)
};


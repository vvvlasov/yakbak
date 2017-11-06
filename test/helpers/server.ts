// Copyright 2016 Yahoo Inc.
// Licensed under the terms of the MIT license. Please see LICENSE file in the project root for terms.

import * as http from 'http';

/**
 * Creates a test HTTP server.
 * @param {Function} done
 * @returns {http.Server}
 */

export default (cb: Function): TestServer => {

  const server: any =
    http.createServer(function (req: http.IncomingMessage, res: http.ServerResponse): void {
      res.statusCode = 201;

      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Date', 'Sat, 26 Oct 1985 08:20:00 GMT');

      req.resume(); // consume the request body, if any

      req.on('end', function (): void {
        res.end('OK');
      });

    }).on('listening', function (): void {
      this.addr = 'localhost';
      this.port = this.address().port;

      this.host = 'http://' + this.addr + ':' + this.port;
    }).on('listening', function (): void {
      this.requests = [];
    }).on('close', function (): void {
      this.requests = [];
    }).on('request', function (req): void {
      this.requests.push(req);
    });

  server.teardown = function (done: Function): void {
    this.close(done);
  };

  return server.listen(cb);
};

export type TestServer = http.Server & {
  teardown: Function,
  host: string,
  addr: string,
  port: string,
  requests: Array<any>
};

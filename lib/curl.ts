import * as http from 'http';
import * as util from 'util';

/**
 * Formats an http.IncomingMessage like curl does
 * @param {http.IncomingMessage}
 * @returns {String}
 */

export function request(req: http.IncomingMessage): string {
  let out = util.format('< %s %s HTTP/%s\n',
    req.method,
    req.url,
    req.httpVersion);

  Object.keys(req.headers).forEach((name: string) => {
    out += util.format('< %s: %s\n', name, req.headers[name]);
  });

  return out + '<';
}

/**
 * Formats an http.ServerResponse like curl does
 * @param {http.ServerResponse}
 * @returns {String}
 */

export function response(req: http.IncomingMessage, res: http.ServerResponse): string {
  let out = util.format('> HTTP/%s %s %s\n',
    req.httpVersion,
    res.statusCode,
    http.STATUS_CODES[res.statusCode]);

  Object.keys(res.getHeaders()).forEach((name: string) => {
    out += util.format('> %s: %s\n', name, res.getHeader(name));
  });

  return out + '>';
}

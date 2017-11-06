import * as http from 'http';
import * as util from 'util';

/**
 * Formats an http.IncomingMessage like curl does
 * @param {http.IncomingMessage}
 * @returns {String}
 */

export function request(req: http.IncomingMessage) {
  var out = util.format('< %s %s HTTP/%s\n',
    req.method,
    req.url,
    req.httpVersion);

  Object.keys(req.headers).forEach(function (name: string) {
    out += util.format('< %s: %s\n', name, req.headers[name]);
  });

  return out + '<';
};

/**
 * Formats an http.ServerResponse like curl does
 * @param {http.ServerResponse}
 * @returns {String}
 */

export function response (req: http.IncomingMessage, res: http.ServerResponse) {
  var out = util.format('> HTTP/%s %s %s\n',
    req.httpVersion,
    res.statusCode,
    http.STATUS_CODES[res.statusCode]);

  Object.keys(res.getHeaders()).forEach(function (name: string) {
    out += util.format('> %s: %s\n', name, res.getHeader(name));
  });

  return out + '>';
};

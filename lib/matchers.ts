import {IncomingMessage} from 'http';
import {yakbak} from '../index';

export function makeExactMatcher(req: IncomingMessage, reqbody: any) {
  return [methodMatcher(req.method), exactUrlMatcher(req.url)];
}

export function methodMatcher($method: string): yakbak.RequestMatcher {
  const match = function (req: IncomingMessage) {
    return req.method === $method;
  };
  const getString = function () {
    return match.toString().replace('$method', '\'' + $method + '\'');
  }
  return {match, getString};
}

export function exactUrlMatcher($url: string): yakbak.RequestMatcher {
  const match = function (req: IncomingMessage) {
    return req.url === $url;
  };
  const getString = function () {
    return match.toString().replace('$url', '\'' + $url + '\'');
  }
  return {match, getString};
}

export function regexUrlMatcher($urlRegexp: string): yakbak.RequestMatcher {
  const match = function (req: IncomingMessage) {
    return new RegExp($urlRegexp).test(req.url);
  };
  const getString = function () {
    return match.toString().replace('$urlRegexp', '\'' + $urlRegexp + '\'');
  }
  return {match, getString};
}
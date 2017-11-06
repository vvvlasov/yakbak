import * as http from 'http';
import {yakbak} from '../index';
import deepEqual = require('deep-equal');

const stringify = (fn: Function, toReplace: string, replaceWith: string) => {
  return fn.toString().replace(toReplace, replaceWith);
};

const stringifyBody = (fn: Function, toReplace: string, replaceWith: {}) => {
  const flatBody = flatten(replaceWith);
  const compArray = Object.keys(flatBody).map((key: string) => `req.body.${key} === ${flatBody[key]}`);
  const compString: string = compArray.join(' &&\n        ');
  return fn.toString().replace(toReplace, `return ${compString};`);
};

const flatten = (target: {}) => {
  const output: any = {};

  const step = (object: any, prev?: any, currentDepth?: number) => {
    currentDepth = currentDepth || 1;
    Object.keys(object).forEach((key: string) => {
      const value = object[key];
      const type = Object.prototype.toString.call(value);
      const isobject = (
        type === '[object Object]' ||
        type === '[object Array]'
      );

      const newKey = prev
        ? prev + '.' + key
        : key;

      if (isobject && Object.keys(value).length) {
        return step(value, newKey, currentDepth + 1);
      }

      output[newKey] = value;
    });
  };

  step(target);

  return output;
};

export function makeExactMatcher(req: http.IncomingMessage & {body?: {}}): Array<yakbak.RequestMatcher> {
  const matcherList = [methodMatcher(req.method), exactUrlMatcher(req.url)];
  if (req.body && req.body !== {}) {
    matcherList.push(exactBodyMatcher(req.body));
  }
  return matcherList;
}

export function methodMatcher($method: string): yakbak.RequestMatcher {
  const matchFn = function (req: http.IncomingMessage & {body?: {}}): boolean {
    return req.method === $method;
  };
  return {
    match: matchFn,
    stringified: stringify(matchFn, '$method', '\'' + $method + '\'')
  };
}

export function exactUrlMatcher($url: string): yakbak.RequestMatcher {
  const matchFn = function (req: http.IncomingMessage & {body?: {}}): boolean {
    return req.url === $url;
  };
  return {
    match: matchFn,
    stringified: stringify(matchFn, '$url', '\'' + $url + '\'')
  };
}

export function regexUrlMatcher($urlRegexp: string): yakbak.RequestMatcher {
  const matchFn = function (req: http.IncomingMessage & {body?: {}}): boolean {
    return new RegExp($urlRegexp).test(req.url);
  };
  return {
    match: matchFn,
    stringified: stringify(matchFn, '$urlRegexp', '\'' + $urlRegexp + '\'')
  };
}

export function exactBodyMatcher($body: {}): yakbak.RequestMatcher {
  const matchFn = function (req: http.IncomingMessage & {body?: {}}): boolean {
    return deepEqual(req.body, $body);
  };
  return {
    match: matchFn,
    stringified: stringifyBody(matchFn, 'return deepEqual(req.body, $body);', $body)
  };
}

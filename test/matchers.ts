"use strict";

var matchers = require('../lib/matchers');
import * as  http from 'http';
var assert = require('assert');
import 'mocha';
import {yakbak} from "../index";

var req = <http.IncomingMessage>{
  method: 'GET',
  url: '/api/something/something'
}

describe('method matchers', function () {

  it('returns true if request matches', function () {
    assert.equal(matchers.methodMatcher('GET').match(req), true);
  });

  it('returns false if request doesn\'t match', function () {
    assert.equal(matchers.methodMatcher('POST').match(req), false);
  });

  it('renders proper string', function () {
    assert.equal(matchers.methodMatcher('GET').getString(), 'function (req) {\n' +
      '        return req.method === \'GET\';\n' +
      '    }')
  });
});

describe('regex url matchers', function () {

  it('returns true if request matches', function () {
    assert.equal(matchers.regexUrlMatcher('/api/something/something').match(req), true);
  });

  it('returns false if request doesn\'t match', function () {
    assert.equal(matchers.regexUrlMatcher('/api/something/nothing').match(req), false);
  });

  it('renders proper string', function () {
    assert.equal(matchers.regexUrlMatcher('/api/something/something').getString(), 'function (req) {\n' +
      '        return new RegExp(\'/api/something/something\').test(req.url);\n' +
      '    }');
  });
});

describe('exact url matchers', function () {

  it('returns true if request matches', function () {
    assert.equal(matchers.exactUrlMatcher('/api/something/something').match(req), true);
  });

  it('returns false if request doesn\'t match', function () {
    assert.equal(matchers.exactUrlMatcher('/api/something/nothing').match(req), false);
  });

  it('renders proper string', function () {
    assert.equal(matchers.exactUrlMatcher('/api/something/something').getString(), 'function (req) {\n' +
      '        return req.url === \'/api/something/something\';\n' +
      '    }');
  });
});

describe('matcher generator', function () {
  it('generates valid matcher', function () {
    var matcherList = matchers.makeExactMatcher(req);
    assert.equal(matcherList.reduce((res: boolean, m: yakbak.RequestMatcher) => res && m.match(req), true), true);
  });
});
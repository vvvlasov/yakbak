"use strict";

var matchers = require('../lib/matchers');
var http = require('http');
var assert = require('assert');

var req = {
  method: 'GET'
}

describe('method matchers', function () {

  it('returns true if request matches', function () {
    assert.equal(matchers.methodMatcher('GET').match(req), true);
  })

  it('returns false if request doesn\'t match', function () {
    assert.equal(matchers.methodMatcher('POST').match(req), false);
  })

  it('renders proper string', function () {
    assert.equal(matchers.methodMatcher('GET').getString(), 'function (req) {\n' +
      '    return req.method === \'GET\';\n' +
      '  }')
  });
});
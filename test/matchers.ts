"use strict";

import * as matchers from '../lib/matchers';
import * as  http from 'http';
import * as assert from 'assert';
import 'mocha';
import {yakbak} from "../index";

const testRequest = <http.IncomingMessage & { body: {} }>{
  method: 'GET',
  url: '/api/something/something?withparameter=a&second=b'
}
const testBody = {
  prop1: 1,
  prop2: 'str1',
  prop3: {
    subprop1: 2,
    subprop2: "str2"
  },
  prop4: [
    {
      subprop1: 2,
      subprop2: "str2"
    },
    {
      subprop3: 4,
      subprop4: "str3"
    }
  ]
};
testRequest.body = testBody;

describe('method matchers', function () {

  it('returns true if request matches', function () {
    assert.equal(matchers.methodMatcher('GET').match(testRequest), true);
  });

  it('returns false if request doesn\'t match', function () {
    assert.equal(matchers.methodMatcher('POST').match(testRequest), false);
  });

  it('renders proper string', function () {
    assert.equal(matchers.methodMatcher('GET').stringified, 'function (req) {\n' +
      '        return req.method === \'GET\';\n' +
      '    }')
  });
});

describe('regex url matchers', function () {

  it('returns true if request matches', function () {
    assert.equal(matchers.regexUrlMatcher('/api/something/.*?withparameter=[a-z]{1}&second=[a-z]+').match(testRequest), true);
  });

  it('returns false if request doesn\'t match', function () {
    assert.equal(matchers.regexUrlMatcher('/api/something/.*?withparameter=[a-z]{2}&second=[a-z]+').match(testRequest), false);
  });

  it('renders proper string', function () {
    assert.equal(matchers.regexUrlMatcher('/api/something/something').stringified, 'function (req) {\n' +
      '        return new RegExp(\'/api/something/something\').test(req.url);\n' +
      '    }');
  });
});

describe('exact url matchers', function () {

  it('returns true if request matches', function () {
    assert.equal(matchers.exactUrlMatcher('/api/something/something?withparameter=a&second=b').match(testRequest), true);
  });

  it('returns false if request doesn\'t match', function () {
    assert.equal(matchers.exactUrlMatcher('/api/something/nothing').match(testRequest), false);
  });

  it('renders proper string', function () {
    assert.equal(matchers.exactUrlMatcher('/api/something/something').stringified, 'function (req) {\n' +
      '        return req.url === \'/api/something/something\';\n' +
      '    }');
  });
});

describe('exact body matchers', function () {

  it('returns true if request matches', function () {
    assert.equal(matchers.exactBodyMatcher(testBody).match(testRequest), true);
  });

  it('returns false if request doesn\'t match', function () {
    assert.equal(matchers.exactBodyMatcher({someprop: 5}).match(testRequest), false);
  });

  it('renders proper string', function () {
    assert.equal(matchers.exactBodyMatcher({
      someprop: 5,
      anotherProp: {subprop1: 'val1', subprop2: 2}
    }).stringified, 'function (req) {\n' +
      '        return req.body.someprop === 5 &&\n' +
      '        req.body.anotherProp.subprop1 === val1 &&\n' +
      '        req.body.anotherProp.subprop2 === 2;\n' +
      '    }');
  });
});


describe('matcher generator', function () {
  it('generates valid matcher', function () {
    var matcherList = matchers.makeExactMatcher(testRequest);
    assert.equal(matcherList.reduce((res: boolean, m: yakbak.RequestMatcher) => res && m.match(testRequest), true), true);
  });
});
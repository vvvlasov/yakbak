function methodMatcher($method) {
  const match = function (req) {
    return req.method === $method;
  };
  const getString = function () {
    return match.toString().replace('$method', '\'' + $method + '\'');
  }
  return {match, getString};
}

module.exports = {methodMatcher}
var path = require("path");

var responseArray = [];
var callIndex = 0;

function getNext() {
  const fn = responseArray[callIndex];
  callIndex += 1;
  return fn;
}

function matchesRequest(req) {
  return [function (req) {
    return req.method === 'GET';
  }].reduce((res, fn) => res && fn(req), true);
}

module.exports = {getNext, matchesRequest};
responseArray.push(
  /**
   * GET /request/path/1
   *
   * host: {addr}:{port}
   * user-agent: My User Agent/1.0
   * connection: close
   */

  function (req, res) {
    res.statusCode = 201;

    res.setHeader("content-type", "text/html");
    res.setHeader("date", "Sat, 26 Oct 1985 08:20:00 GMT");
    res.setHeader("connection", "close");
    res.setHeader("content-length", "2");

    res.setHeader("x-yakbak-tape", path.basename(__filename, ".js"));

    res.end();

    return __filename;
  }
)

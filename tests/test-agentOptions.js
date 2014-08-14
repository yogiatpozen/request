var request = require('../index')
  , http = require('http')
  , server = require('./server')
  , assert = require('assert')
  , tape = require('tape')
  , s
  , port = 8111
  ;

tape('setup', function (t) {
  s = http.createServer(function (req, resp) {
    resp.statusCode = 200
    resp.end('')
  }).listen(port, function () {
    t.end()
  })
})

tape('agent w/o options', function (t) {
  t.plan(2)
  // requests without agentOptions should use global agent
  var r = request('http://localhost:'+port, function (e, resp, body) {
    t.deepEqual(r.agent, http.globalAgent);
    t.equal(Object.keys(r.pool).length, 0);
  })
})

tape('agent w/ options', function (t) {
  t.plan(2)
  // requests with agentOptions should apply agentOptions to new agent in pool
  var r2 = request('http://localhost:'+port, { agentOptions: { foo: 'bar' } }, function (e, resp, body) {
    t.equal(r2.agent.options.foo, 'bar');
    t.equal(Object.keys(r2.pool).length, 1);
  });
})

tape('cleaup', function (t) {
  s.close()
  t.end()
})

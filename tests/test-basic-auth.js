var assert = require('assert')
  , http = require('http')
  , request = require('../index')
  , tape = require('tape')

  , basicServer
  ;

tape('setup', function (t) {
  basicServer = http.createServer(function (req, res) {
    console.log('Basic auth server: ', req.method, req.url)

    var ok

    if (req.headers.authorization) {
      if (req.headers.authorization == 'Basic ' + new Buffer('test:testing2').toString('base64')) {
        ok = true
      } else if ( req.headers.authorization == 'Basic ' + new Buffer('test:').toString('base64')) {
        ok = true
      } else if ( req.headers.authorization == 'Basic ' + new Buffer(':apassword').toString('base64')) {
        ok = true
      } else if ( req.headers.authorization == 'Basic ' + new Buffer('justauser').toString('base64')) {
        ok = true
      } else {
        // Bad auth header, don't send back WWW-Authenticate header
        ok = false
      }
    } else {
      // No auth header, send back WWW-Authenticate header
      ok = false
      res.setHeader('www-authenticate', 'Basic realm="Private"')
    }

    if (req.url == '/post/') {
      var expectedContent = 'data_key=data_value'
      req.on('data', function(data) {
        basicServer.t.equal(data.toString(), expectedContent)
        console.log('received request data: ' + data)
      });
      basicServer.t.equal(req.method, 'POST')
      basicServer.t.equal(req.headers['content-length'], '' + expectedContent.length)
      basicServer.t.equal(req.headers['content-type'], 'application/x-www-form-urlencoded; charset=utf-8');
    }

    if (ok) {
      res.end('ok')
    } else {
      res.statusCode = 401
      res.end('401')
    }
  })
  basicServer.listen(6767, t.end.bind(t))
})

tape('sendImmediately false', function (t) {
  t.plan(1)
  request({
    'method': 'GET',
    'uri': 'http://localhost:6767/test/',
    'auth': {
      'user': 'test',
      'pass': 'testing2',
      'sendImmediately': false
    }
  }, function(error, res, body) {
    t.equal(res.statusCode, 200)
  })
})

tape('sendImmediately default', function (t) {
  t.plan(1)
  // If we don't set sendImmediately = false, request will send basic auth
  request({
    'method': 'GET',
    'uri': 'http://localhost:6767/test2/',
    'auth': {
      'user': 'test',
      'pass': 'testing2'
    }
  }, function(error, res, body) {
    t.equal(res.statusCode, 200)
  })
})

tape('auth in url', function (t) {
  t.plan(1)
  request({
    'method': 'GET',
    'uri': 'http://test:testing2@localhost:6767/test2/'
  }, function(error, res, body) {
    t.equal(res.statusCode, 200)
  })
})

tape('form post w/ sendImmediately false', function (t) {
  basicServer.t = t
  request({
    'method': 'POST',
    'form': { 'data_key': 'data_value' },
    'uri': 'http://localhost:6767/post/',
    'auth': {
      'user': 'test',
      'pass': 'testing2',
      'sendImmediately': false
    }
  }, function(error, res, body) {
    t.equal(res.statusCode, 200)
    basicServer.t = null
    t.end()
  })
})

tape('allow empty user', function (t) {
  t.plan(1)
  request({
    'method': 'GET',
    'uri': 'http://localhost:6767/allow_empty_user/',
    'auth': {
      'user': '',
      'pass': 'apassword',
      'sendImmediately': false
    }
  }, function(error, res, body ) {
    t.equal(res.statusCode, 200)
  })
})

tape('allow undefined password', function (t) {
  t.plan(1)
  request({
    'method': 'GET',
    'uri': 'http://localhost:6767/allow_undefined_password/',
    'auth': {
      'user': 'justauser',
      'pass': undefined,
      'sendImmediately': false
    }
  }, function(error, res, body ) {
    t.equal(res.statusCode, 200)
  })
})

tape('chain api', function (t) {
  t.plan(1)
  request
  .get('http://localhost:6767/test/')
  .auth("test","",false)
  .on('response', function (res) {
    t.equal(res.statusCode, 200);
  })
})

tape('empty pass w/ sendImmediately false', function (t) {
  t.plan(1)
  request.get('http://localhost:6767/test/',
  {
    auth: {
      user: "test",
      pass: "",
      sendImmediately: false
    }
  }, function (err, res) {
    t.equal(res.statusCode, 200)
  })
})

tape('teardown', function (t) {
  basicServer.close()
  t.end()
})

icebreaker-rpc
============
[muxrpc](https://github.com/ssbc/muxrpc) for [icebreaker-peer](https://github.com/alligator-io/icebreaker-peer) implementations.

[![Build Status](https://travis-ci.org/alligator-io/icebreaker-rpc.svg?branch=master)](https://travis-ci.org/alligator-io/icebreaker-rpc)
## Prerequisites
```bash
npm install --save icebreaker
```
## Install
```bash
npm install --save icebreaker-rpc
```

## Example
```javascript
var _ = require('icebreaker')
require('icebreaker-peer-net')
require('icebreaker-agent-udp')
require('icebreaker-rpc')
var c = 1

var rpc = _.rpc({
  name: 'test',
  version: '1.0.0',
  manifest: {
    hello: 'async'
  },
  api: {
    hello: function (v, cb) {
      cb(null, v + ' world' + (c++))
    }
  }
})

var peer = _.peers.net({
  port: 8988
})

rpc.use(peer)

peer.start()

_.agents.udp({
  peers: [peer],
  port: 8886,
  loopback: true
}).start()


var http = require('http');

http.createServer(function (req, res) {
  try {
    var rpc = rpc2.get({
      name: 'test',
      version: '1.0.0'
    })
    rpc.api.hello('hello', function (err, v) {
      if (err) return res.end(err.message || err)
      res.end(v);
    })
  } catch (e) {
    console.log(e)
    res.end(e.message)
  }
}).listen(1337, '127.0.0.1');

console.log('http://127.0.0.1:1337')

var rpc2 = _.rpc({
  name: 'httpServer',
  version: '1.0.0'
})

var peer2 = _.peers.net({
  port: 8989
})

rpc2.use(peer2)

peer2.start()

_.agents.udp({
  peers: [peer2],
  port: 8886,
  loopback: true
}).start()
```
## License
MIT

var msgpack = require('../lib/msgpack.js')
require('muxrpc/test/async')(msgpack, true)
require('muxrpc/test/abort')(msgpack, true)
require('muxrpc/test/closed')(msgpack, true)
require('muxrpc/test/stream-end')(msgpack, true)
var _ = require('icebreaker')

_.mixin({
  rpc: require('./lib/rpc')
})

_.mixin({permissions:require('muxrpc/permissions')},_.rpc)

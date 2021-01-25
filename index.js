module.exports.Local = require('./lib/local')
module.exports.Sync = require('./lib/sync')
module.exports.Async = require("./lib/async")
module.exports.AsyncPromise = require("./lib/promise")
module.exports.Source = require("./lib/source")
module.exports.Sink = require("./lib/sink")
module.exports.Duplex = require("./lib/duplex")
module.exports.Action = require("./lib/action")
module.exports.RPC=require('./lib/rpc')

var isBrowser = require('is-in-browser').default;
if(!isBrowser){
module.exports.Server=require('./lib/server')
module.exports.Peer=require('./lib/peer')
}

module.exports.Connect=require('./lib/connect')
module.exports.KeyPair = require('./lib/keypair')
module.exports.Permissions = require('muxrpc/permissions')
module.exports._ = require('icebreaker') 



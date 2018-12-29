const _ = require('icebreaker')
const RPC = require("./rpc")
const utils = require('icebreaker-network/lib/util')
const connect = require("icebreaker-peer/lib/connect")

module.exports = function (addr, _local, opts, cb) {
  if (_.isFunction(opts)) {
    cb = opts
    opts = {}
  }

  if (!_.isPlainObject(opts)) opts = {}

  opts.authenticate = opts.authenticate || function (id, cb) { cb(null, true) }

  connect(addr, opts, (err, e) => {
    
    if (err) return cb(err)
    let peerID = null
    let duplex = RPC(_local, Object.assign({}, opts, { isClient: true, id: "client" }), (err, api) => {
      e.end = duplex.end;
      err = err || e.error
      if (err) return cb(err)


      if (e && api) e.peer = api

      if (e.peerID == null) {
        err = 'closing the connection peerID is undefined or null '
        return setImmediate(() => duplex.end(err, () => { cb(err) }))
      }

      opts.authenticate(e.peerID, function (err, auth) {
        if (auth == null && !err) err = new Error('client unauthorized')
        if (!auth) err = err || 'client authentication rejected'
        if (err) return setImmediate(() => duplex.end(err, () => { cb( err) }))
        e.auth = auth
        cb(null, e)
      })
    })
    e.end = duplex.end
    _(e, duplex, e)
  })
}
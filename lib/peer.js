const Peer = require("icebreaker-peer")
const _ = require("icebreaker")
const handleConnection = require("./utils").handleConnection

module.exports = function (_local, opts) {
  if (!_.isPlainObject(opts)) opts = {}
  opts.authenticate = opts.authenticate || function (id, cb) { cb(null, true) }


  const peer = Peer(opts)
  const source = _(peer,
    peer.asyncMap({connection: (e, cb) => handleConnection(_local,e,opts,cb) }),
    peer.map({
      connectionError: (e) => {
        if (e.rpcCallback != null) {
          const c = e.rpcCallback
          delete e.rpcCallback
          c(e.error)
          e.type = "disconnection"
        }
        return e
      },
      connection: (e) => {
        if (e.rpcCallback != null) {
          let c = e.rpcCallback
          delete e.rpcCallback
          c(null, e)
        }
        return e
      }
    })
  )

  return Object.assign(source, peer, {
    connect: (addr, opts, cb) => {

      if (_.isFunction(opts)) {
        cb = opts
        opts = {}
      }

      if (!_.isPlainObject(opts)) opts = {}

      peer.connect(addr, opts, (err, e) => {
        if (err) return cb(err)
        if (cb) e.rpcCallback = cb
      })

    }
  })

}
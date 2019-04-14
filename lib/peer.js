const Peer = require("icebreaker-peer")
const _ = require("icebreaker")
const RPC = require("./rpc")

function isPermissions(perms) {
  return perms && _.isFunction(perms.test) && _.isFunction(perms.pre) && _.isFunction(perms.post)
}


module.exports = function (_local, opts) {


  if (!_.isPlainObject(opts)) opts = {}
  opts.authenticate = opts.authenticate || function (id, cb) { cb(null, true) }


  const peer = Peer(opts)
  const source = _(peer,
    peer.asyncMap({
      connection: (e, cb) => {

        const create = (perms) => {

          const duplex = RPC(_local, Object.assign({}, opts, { isClient: e.address != null, perms: perms }), (err, api) => {
            e.end = duplex.end;
            err = err || e.error
            if (err != null) {
              e.type = "connectionError"
              e.error = e.error || err
              cb(e)
              return
            }

            if (e && api) e.peer = api
            if (e.peerID == null) {
              e.error = 'closing the connection peerID is undefined or null '
              return setImmediate(() => duplex.end(err, () => { cb(e) }))
            }

            cb(e)
          })

          e.end = (...args) => duplex.end(...args)

          _(e, duplex, e)
        }

        if (!e.error,opts.perms && _.isFunction(opts.perms) && !isPermissions(opts.perms)) return opts.perms(e.peerID, (err, perms) => {
          if (err) {
            e.error = err
            perms = { allow: [] }
          }
          create(perms)
        })
    
        create(e.error?{ allow: [] }:opts.perms)
    

      }
    }),
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
const RPC = require("./rpc")
const _ = require("icebreaker")

module.exports = {}

function isPermissions(perms) {
  return perms && _.isFunction(perms.test) && _.isFunction(perms.pre) && _.isFunction(perms.post)
}

module.exports.handleConnection = (_local, e, opts, cb) => {

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


  if (e.peerID && opts.perms && _.isFunction(opts.perms) && !isPermissions(opts.perms)) return opts.perms(e.peerID, (err, perms) => {
    if (err) {
      e.error = err
      perms = { allow: [] }
    }
    create(perms)
  })

  create(!e.peerID ? { allow: [] } : opts.perms)

}
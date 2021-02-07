const RPC = require("./rpc")
const _ = require("icebreaker")

module.exports = {}

function isPermissions(perms) {
  return perms && _.isFunction(perms.test) && _.isFunction(perms.pre) && _.isFunction(perms.post)
}

module.exports.handleConnection = (_local, e, opts, cb) => {
 
  const create = (perms) => {
    if(!e.peerID){
        _(e,e)
        e.type = "connectionError"
        e.error = 'closing the connection peerID is undefined or null'
        cb(e)
        setImmediate(()=>e && e.end && e.end(e.error,()=>{}))
        return;      
    }

    const duplex = RPC(_local, Object.assign({}, opts, { id:e.peerID,isClient: e.address != null, perms: perms }), (err, api) => {
      e.end = duplex.end;
      err = err || e.error
      if (err != null) {
        e.type = "connectionError"
        e.error = e.error || err
        cb(e)
        setImmediate(()=>{e.end && e.end(e.error)})
        return
      }

      if (e && api) e.peer = api
     

      cb(e)
    })

    e.end = (...args) => duplex.end(...args)

    _(e, duplex, e)
  }


  if (opts.perms && _.isFunction(opts.perms) && !isPermissions(opts.perms)) return opts.perms(e.peerID, (err, perms) => {
    if (err) {
      e.error = err
      perms = { allow: [] }
    }
    create(perms)
  })

  create(e.peerID,{ allow: opts.perms })

}
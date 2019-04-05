const _ = require('icebreaker')
const RPC = require("./rpc")
const connect = require("icebreaker-peer/lib/connect")

function isPermissions (perms) {
  return  perms &&_.isFunction(perms.test) && _.isFunction(perms.pre) && _.isFunction(perms.post)
}

module.exports = function (addr, _local, opts, cb) {
  if (_.isFunction(opts)) {
    cb = opts
    opts = {}
  }

  if (!_.isPlainObject(opts)) opts = {}

  connect(addr, opts, (err, e) => {
    
    if (err) return cb(err)

    const create =(perms)=>{
     
      let duplex = RPC(_local, Object.assign({}, opts, { isClient: true, id: "client" ,perms:perms}), (err, api) => {
        e.end = duplex.end;
        err = err || e.error
        if (err) return cb(err)
        
        
        if (e && api) e.peer = api
        
        if (e.peerID == null) {
          err = 'closing the connection peerID is undefined or null '
          return setImmediate(() => duplex.end(err, () => { cb(err) }))
        }
        
        cb(null, e)
        
      })
      e.end = duplex.end
      _(e, duplex, e)
    }

    if(opts && opts.perms && _.isFunction(opts.perms) && !isPermissions(opts.perms))return opts.perms(e.peerID,(err,perms)=>{
      if(err)e.error = err
       create(perms)
    })

    create(opts&& opts.perms?opts.perms:null)

  })
}
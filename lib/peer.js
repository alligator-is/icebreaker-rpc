const Peer = require("icebreaker-peer")
const _ = require("icebreaker")
const RPC = require("./rpc")


module.exports = function (_local, opts) {


  if (!_.isPlainObject(opts)) opts = {}
  opts.authenticate = opts.authenticate || function (id, cb) { cb(null, true) }


  const peer = Peer(opts)
  const source = _(peer, 
    peer.asyncMap({
      connection: (e, cb)=>{
        
        const duplex = RPC(_local, Object.assign({}, opts, { isClient: e.address != null }), (err, api) => {
          e.end = duplex.end;
          err = err || e.error
          if (err !=null){
            e.type = "connectionError"
            e.error = e.error||err
            cb(e)
            return
          }

          if (e && api) e.peer = api
          if (e.peerID == null) {
            e.error='closing the connection peerID is undefined or null '
             return setImmediate(()=>duplex.end(err,()=>{ cb(e) }))
          }

          if(e.address != null){
            return opts.authenticate(e.peerID,function(err,auth){
              if(auth == null && !err) err = new Error('client unauthorized')
              if(!auth) err = err||'client authentication rejected'
              if(err){
                e.error = err
                return setImmediate(()=>duplex.end(err,()=>{ cb(e) }))
              }
              e.auth = auth
              cb(e)
            })
          }
       
         cb(e)
        })
        e.end = (...args)=> duplex.end(...args)
        
        _(e,duplex,e)
      }
    }),
    peer.map({
      connectionError:function(e){
        if (e.rpcCallback != null) {
          let c = e.rpcCallback
          delete e.rpcCallback
          c(e.error)
          e.type="disconnection"
        }
        return e
      },
      connection: (e) =>{
        if (e.rpcCallback != null) {
          let c = e.rpcCallback
          delete e.rpcCallback
          c(null, e)
        }
        return e
      }
    })
  );

  return Object.assign(source, peer, {
    connect: (addr, opts, cb) =>{

      if (_.isFunction(opts)) {
        cb = opts
        opts = {}
      }
      if (!_.isPlainObject(opts)) opts = {}

      peer.connect(addr, opts,  (err, e) =>{
        if(err) return cb(err)
        if (cb) e.rpcCallback = cb
      })
    
    }
  })

}
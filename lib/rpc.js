const muxrpc = require('muxrpc')
const handshake = require("./handshake")
const _ = require('icebreaker')
const traverse = require('traverse');
const clone = traverse.clone
const Remote = require('./remote')
const Util = require('muxrpc/util')
const promiseToCallback = require('promise-to-callback');

function toManifest(api) {
  const manifest = traverse.clone(api)
  traverse(manifest).forEach(function (x) {
    if (_.isPlainObject(x) && _.isString(x.type)) {
      if (x.type === "sink") x.type = "duplex"
      if (x.type === "promise") x.type = "async"
      this.update(x.type)
    }
  })
  return manifest
}

module.exports = function RPC(_local, opts, cb) {
  let local
  if (_local) {
    local = clone(_local);
    traverse(local).forEach(function (x) {
      if (_.isFunction(x)) {
        const obj = {};
        for (let i in x) obj[i] = x[i]
        this.update(obj)
      }
    })
    _local = clone(_local)
    traverse(_local).forEach(function (x) {
      if (_.isFunction(x) && x.type === "promise") {
        const obj = function (...args) {
          const cb = args.length > 0 && _.isFunction(args[args.length - 1]) ? args.pop() : null
          promiseToCallback(x(...args))(function (err, data) {
            if (cb) cb(err, data)
          });

        }
        for (let i in x) obj[i] = x[i]
        this.update(obj)
      }
      else if (_.isFunction(x) && x.type === "sink") {
        const obj = function (...args) {
          const p = _.pushable((err) => { if (cb) { cb(err); cb = null } })
          let cb = p.end
          return {
            source: p,
            sink: x(...args, function (err) {
              if (cb != null) {
                cb(err);
                cb = null;
                return;
              }

            })
          }
        };
        for (let i in x) obj[i] = x[i]
        this.update(obj)
      }
    })
  }


  if (_.isFunction(opts)) {
    cb = opts
    opts = {}
  }

  if (!_.isFunction(cb)) throw new Error("cb is required")
  
  
  opts = opts || {}
  if (opts.isClient == null) throw new Error("opts.isClient is required")
  
  let wrap =  _.isFunction(opts.wrap)?opts.wrap:undefined
  delete opts.wrap

  let abortCB
  let abortError
  
  let muxer
  const shake = handshake(local,function(err, rest, remote){
   if(err) { return cb(err) }
    muxer = muxrpc(toManifest(remote), toManifest(local), _local, null, opts.perms)
    
    shake.end =  function(err,cb){
      if(_.isFunction(err)){
        cb=err
        err=null
      }
      if(rest.end) return rest.end(err||true,cb||function(){ })
      return muxer.stream.close(err||true,cb||function(){ })
    }
    
    if(wrap) rest = wrap(Object.assign({end:(err,cb)=>{
      return muxer.stream.close(err||true,cb||function(){ })   
    }},rest))
  
    _(rest,muxer.stream, rest)
    
    let r = Remote(remote, (type, path, args) => {

      if (type === "promise") {
        return new Promise(function (resolve, reject) {
          const cb2 = function (err, data) {
            if (err) return reject(err)
            return resolve(data)
          }
          muxer.stream.remoteCall("async", path, args, cb2)
        });
      }

      const cb2 = _.isFunction(args[args.length - 1]) ? args.pop() : (err) => {
        if (err) throw new Error('callback not provided')
      }
      try {

        if (muxer.stream.closed) throw new Error('stream is closed')
        if (type === "sink") {
          let d = muxer.stream.remoteCall("duplex", path, args)
          _(d.source, _.onEnd(cb2))
          return d.sink
        }

        return muxer.stream.remoteCall(type, path, args, cb2)
      }
      catch (err) {
        return Util.errorAsStreamOrCb(type, err, cb2)
      }
    });
    
    cb(err, r)
  }, opts.isClient,opts.timeout)

 

  return shake
}



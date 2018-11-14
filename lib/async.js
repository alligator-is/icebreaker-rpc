const superstruct = require("superstruct").superstruct
const _ = require('icebreaker')

module.exports=function(func,opts,defaults){
  if(!_.isFunction(func)) throw new Error("function is required")
    if(typeof opts ==="string" || Array.isArray(opts))opts={input:opts}
    opts = typeof opts && 'object' === typeof opts && !Array.isArray(opts)?opts:{input:null}
    const struct = superstruct({types:opts.types||{}});
    
    opts.defaults=defaults||opts.defaults

    const input = opts.input?struct(opts.input,opts.defaults):null;
  
    let async = function(...args){
      if(args.length<1||typeof args[args.length-1] !== "function") return new TypeError("callback is required")
      const cb = args[args.length-1]
      args.pop()
        
      try{
        if(input){
          if(Array.isArray(opts.input)) input(args);
          else input(...args);
        }
        func.call({id:opts.id},...args,cb)
    
      }
      catch(err){
        return cb(err,null)
      }
   }

   Object.assign(async,opts)

   async.type="async"

   return async;
 }
 
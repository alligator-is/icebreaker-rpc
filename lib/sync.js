const superstruct = require("superstruct").superstruct
const _ = require('icebreaker')

module.exports = function Sync(func, opts, defaults) {
    if (!_.isFunction(func)) throw new Error("function is required")
    if (typeof opts === "string" || Array.isArray(opts)) opts = { input: opts } 
    opts = typeof opts && 'object' === typeof opts && !Array.isArray(opts) ? opts : {}
    opts.defaults=defaults||opts.defaults
   
    const input = opts.input ? superstruct({ types: opts.types || {} })(opts.input,opts.defaults) : null;
    let sync = (...args) => {
        const cb = _.isFunction(args[args.length - 1]) ? args.pop() : null
        try {
            
            if (input) {
                if (Array.isArray(opts.input)) {args=input(args); }
                else args=input(...args);
                if(!Array.isArray(args))args = [args]
            }

            if (cb) { return func(...args, cb) }
            
            return func(...args)
        }
        catch (err) {
            if (cb) { return cb(err) }
            throw err
        }
    }
    
    Object.assign(sync, opts)

    sync.type = "sync"

    return sync;
}
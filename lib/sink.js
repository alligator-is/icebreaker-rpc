
const superstruct = require("superstruct").superstruct
const _ = require('icebreaker')

module.exports = function Sink(func, opts, defaults) {
    if (!_.isFunction(func)) throw new Error("function is required")
    if (typeof opts === "string" || Array.isArray(opts)) opts = { input: opts }
    opts = typeof opts && 'object' === typeof opts && !Array.isArray(opts) ? opts : {}

    if (defaults) opts.defaults = defaults

    const input = opts.input ? superstruct({ types: opts.types || {} })(opts.input, opts.defaults) : null;

    let sink = (...args) => {
        if (args.length < 1 || typeof args[args.length - 1] !== "function") return new TypeError("callback is required")

        const cb = args[args.length - 1]
        let ended = false;
        const _cb = (err) => {
            if (!ended) {
                cb(err)
                ended = true;
            }
        }

        args.pop()

        try {
            if (input) {
                if (Array.isArray(opts.input)) { args = input(args); }
                else args = input(...args);
                if (!Array.isArray(args)) args = [args]
            }
        }
        catch (err) {
            return (read) => read(err || true, (_err) => _cb(err || _err))
        }
        return func(...args, _cb)
    }

    Object.assign(sink, opts)
    sink.type = "sink"

    return sink;
}



const superstruct = require("superstruct").superstruct
const _ = require('icebreaker')
const isPromise = require('is-promise')

module.exports = function (func, opts, defaults) {
  if (!_.isFunction(func)) throw new Error("function is required")
  if (_.isString(opts) || Array.isArray(opts)) opts = { input: opts }
  opts = _.isPlainObject(opts) ? opts : {}
  const struct = superstruct({ types: opts.types || {} });

  if(defaults)opts.defaults=defaults

  const input = opts.input ? struct(opts.input, opts.defaults) : null;

  let promise = async function (...args) {
    if (input) {
      if (Array.isArray(opts.input)) args=input(args);
      else args=input(...args);
      if(!Array.isArray(args))args = [args]
    }

    let res = func(...args)
    if (!isPromise(res)) throw new TypeError("first argument must be a Promise");
    return await res
  }

  Object.assign(promise, opts)
  promise.type = "promise"
  if(!opts.defaults) opts.defaults=[]
  if(defaults)promise.defaults = opts.defaults.concat(defaults)
 
  return promise;
}

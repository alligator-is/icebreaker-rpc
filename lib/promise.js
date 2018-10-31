const superstruct = require("superstruct").superstruct
const _ = require('icebreaker')
const isPromise = require('is-promise')

module.exports = function (func, opts, defaults) {
  if (!_.isFunction(func)) throw new Error("function is required")
  if (_.isString(opts) || Array.isArray(opts)) opts = { input: opts }
  opts = _.isPlainObject(opts) ? opts : { input: null }
  const struct = superstruct({ types: opts.types || {} });
  const input = opts.input ? struct(opts.input, defaults) : null;

  let promise = async function (...args) {
    if (input) {
      if (Array.isArray(opts.input)) input(args);
      else input(...args);
    }

    let res = func(...args)
    if (!isPromise(res)) throw new TypeError("first argument must be a Promise");
    return await res
  }

  promise.type = "promise"
  return promise;
}

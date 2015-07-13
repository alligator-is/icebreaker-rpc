
exports.isFunction=function(f) {
  return 'function' === typeof f
}

exports.isString=function(s) {
  return typeof s === 'string'
}

exports.isPlainObject=function(o) {
  return o && 'object' === typeof o && !Array.isArray(o)
}

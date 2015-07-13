
exports.isFunction=function(f) {
  return 'function' === typeof f
}

exports.isString=function(s) {
  return typeof s === 'string'
}

exports.isPlainObject=function(o) {
  return o && 'object' === typeof o && !Array.isArray(o)
}

exports.isEmpty = function(obj){
  if(obj == null)return true
  for(var key in obj) if (obj.hasOwnProperty(key)) return false;
  return true
}

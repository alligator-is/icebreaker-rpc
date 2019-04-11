const _ = require('icebreaker')
const assign = require('assign-deep');

module.exports = function Local(api) {
  const opts = {
    set: (target, key, value) => {
      if (_.isFunction(value)) {
        target[key] = value;
        if (!(value.type === "async" || value.type === "sync" ||
          value.type === "source" || value.type === "sink" || value.type === "promise" || value.type === "duplex"))
          throw new TypeError('type of ' + (key || "null") + ' must be Async, Sync, Source, Duplex or Sink but is ' + (typeof value));
        return true;
      }

      if (_.isPlainObject(value)) {
        target[key] = Object.assign(new Proxy({}, opts), value)
        return true
      }
    }
  }

  let proxy = new Proxy({}, opts);
  if (api) assign(proxy, api)
  return proxy
}

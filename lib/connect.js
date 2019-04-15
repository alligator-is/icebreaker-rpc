const _ = require('icebreaker')
const connect = require("icebreaker-peer/lib/connect")
const handleConnection = require("./utils").handleConnection

module.exports = function (addr, _local, opts, cb) {
  if (_.isFunction(opts)) {
    cb = opts
    opts = {}
  }

  if (!_.isPlainObject(opts)) opts = {}

  connect(addr, opts, (err, e) => {
    if (err) return cb(err)
    handleConnection(_local, e, opts, (e) => {
      if (e.error) return cb(e.error)
      cb(null, e)
    })
  })
}
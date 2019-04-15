
const Server = require("icebreaker-peer/lib/server")
const _ = require("icebreaker")
const handleConnection = require("./utils").handleConnection

module.exports = function (_local, opts) {
  if (!_.isPlainObject(opts)) opts = {}

  opts.authenticate = opts.authenticate || function (id, cb) {
    cb(null, true)
  }

  const server = Server(opts)

  const source = _(
    server,
    server.asyncMap({ connection: (e, cb) => handleConnection(_local, e, opts, cb) }),
    server.map({
      connectionError: function (e) {
        e.type = "disconnection"
        return e
      }
    })
  );

  return Object.assign(source, server)
}



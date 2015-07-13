require('icebreaker-msgpack')

var handshake = require('./handshake')
var muxrpc = require('muxrpc')
var semver = require('semver')
var u = require('./utils')
var Tree = require('./tree')

var EventEmitter = require('events').EventEmitter

module.exports = function (params) {
  var _ = this
  var isPlainObject = u.isPlainObject
  var isString = u.isString

  if (!isPlainObject(params)) throw new Error('first argument must be a object')
  if (!params.serializer) params.serializer = _.msgpack.serializer
  if (!params.name) throw new Error('name is required')
  if (!params.version) throw new Error('version is required')
  if (!isPlainObject(params.manifest)) params.manifest = null

  var local = {
    name: params.name,
    version: params.version,
  }

  if (isPlainObject(params.manifest)) local.manifest = params.manifest

  var tree = Tree();

  var emitter = new EventEmitter()

  if (u.isFunction(params.onRpc))
    emitter.on('rpc', params.onRpc)

  emitter.get = function (api, cb) {
    function error(msg) {
      if (!cb) throw new Error(msg)
      cb(new Error(msg))
    }

    if (!isPlainObject(api)) return error('first argument must be a object')

    var name = api.name,
      version = api.version

    if (!isString(name)) return error('name is required')

    if (!isString(version)) return error('version is required')

    if (!semver.valid(version)) {
      return error('api version ' + (version ? name + '@' + version : name) + ' is not valid!')
    }

    var rpc = tree.get(api)

    if (!rpc) {
      return error('api ' + name + '@' + version + ' not found!')
    }

    if (!cb) return rpc
    cb(null, rpc)
  }

  emitter.use = function (peer) {
    var self = this

    function onConnection(connection) {
      _(
        connection,
        handshake(local, function (rest, remote) {
          var rpc = muxrpc(
            remote.manifest || {},
            local.manifest || {},
            params.serializer
          )(params.api || {},params.permissions)

          var s = rpc.createStream()

          _(s, rest, s);

          remote.api = rpc
          remote.id = connection.id

          connection.close = rpc.close

          if (!isPlainObject(remote) ||
            !isString(remote.name) ||
            !semver.valid(remote.version)) {
            rpc.close(function () {})
            return
          }

          tree.add(remote)

          try{
            self.emit('rpc', emitter.get({
              version: remote.version,
              name: remote.name
            }))
          }
          catch(e){
            self.emit('error',e)
          }
        }),
        connection
      )
    }

    function onDisconnect(connection) {
      tree.del(connection.id)
    }

    function onStopped() {
      this.removeListener('connection', onConnection);
      this.removeListener('stopped', onStopped);
      this.removeListener('disconnected', onDisconnect)
    }

    peer.on('connection', onConnection)
    peer.on('disconnected', onDisconnect)
    peer.on('stopped', onStopped)
  }

  return emitter
}

var u = require('./utils')
var handshake = require('pull-handshake')
var _ = require('icebreaker')

module.exports = function (local, cb) {
  var stream = handshake(function (err) {
    if (err) console.error(err.message||err)
  })

  var shake = stream.handshake
  var l = new Buffer(JSON.stringify(local));
  var buf = new Buffer(4)
  buf.writeUInt32BE(l.length,0)
  shake.write(Buffer.concat([buf,l]));

  function error(err){
    if(err === true) return shake.abort(new Error('unexpected end of handshake stream'))
    return shake.abort(err)
  }

  shake.read(4, function (err, data) {
    if(err)return error(err)
    var len = data.readUInt32BE(0)
    shake.read(len, function (err, data) {
      if(err)return error(err)
      var meta
      try {
        meta = JSON.parse(data)
      } catch (e) {
        console.error(e)
      }
      cb(shake.rest(), u.isPlainObject(meta) ? meta : {})
    })
  })


  return {
    source:stream.source,
    sink:_(
      _.asyncMap(function(data,cb){
        if(!Buffer.isBuffer(data))
          return cb(new Error('data data must be a buffer, was: ' + JSON.stringify(data)))
        cb(null,data)
      }),
      stream.sink
    )
  }
}

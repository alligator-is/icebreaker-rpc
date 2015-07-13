var u = require('./utils')
var handshake = require('pull-handshake')

module.exports = function (local, cb) {
  var stream = handshake(function (err) {
    if (err) console.error(err)
  })

  var shake = stream.handshake
  var l = new Buffer(JSON.stringify(local));
  var buf = new Buffer(4)
  buf.writeUInt32BE(l.length,0)
  shake.write(Buffer.concat([buf,l]));

  shake.read(4, function (err, data) {
    var len = data.readUInt32BE(0)
    shake.read(len, function (err, data) {
      var meta
      try {
        meta = JSON.parse(data)
      } catch (e) {
        console.error(e)
      }
      cb(shake.rest(), u.isPlainObject(meta) ? meta : {})
    })
  })

  return stream
}

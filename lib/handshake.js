var u = require('./utils')
var handshake = require('pull-handshake')

module.exports = function (local, cb) {
  var stream = handshake(function (err) {
    if (err) console.error(err)
  })

  var shake = stream.handshake
  var l = JSON.stringify(local);
  var buf = new Buffer(l.length + 4)
  buf.writeInt32BE(l.length)
  buf.fill(l, 4)
  shake.write(buf);

  shake.read(4, function (err, data) {
    var len = data.readInt32BE()
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

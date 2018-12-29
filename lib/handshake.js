const handshake = require('pull-handshake')
const _ = require('icebreaker')
const ms = require('ms')

module.exports = function (local, cb, isListener,timeout) {
  let closed = false;
  const stream = handshake({ timeout: timeout||ms('10s') }, (err) =>{
    if(closed==false)error(err)
  })
  
  let l = Buffer.from(JSON.stringify(local||{}))
  const shake = stream.handshake
  if (!isListener) {
    const buf = Buffer.alloc(4)
    buf.writeUInt32BE(l.length, 0)
    shake.write(Buffer.concat([buf, l]))
  }


  let error=(err) => {
    if(closed===true) return
    if (err === true) err = new Error('unexpected end of handshake stream')
    shake.abort(err)
    closed=true
    if (err && cb){
      cb(err)
      delete cb
    } 
  }

  shake.read(4,(err, data) => {
    if (err) return error(err)
    const len = data.readUInt32BE(0)
    shake.read(len,  (err, data) => {
      if (err) return error(err)
      let meta
      try {
        meta = JSON.parse(data.toString())
        if (!_.isPlainObject(meta)) return error(true)
      } catch (e) {
        return error(e)
      }
      if (isListener) {
        const buf = Buffer.alloc(4)
        buf.writeUInt32BE(l.length, 0)
        shake.write(Buffer.concat([buf, l]))
      }

      cb(null, shake.rest(), meta || {})
    })
  })

  return {
    source: stream.source,
    sink: stream.sink,
    abort:shake.abort
  }
}

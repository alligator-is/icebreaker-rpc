const handshake = require('pull-handshake')
const _ = require('icebreaker')
const ms = require('ms')

const { Packr} = require('msgpackr/pack');
const { Unpackr } = require('msgpackr/unpack')
let packr = new Packr({ useRecords: false })

module.exports = function (local, cb, isListener,timeout) {

  let closed = false;
  const stream = handshake({ timeout: timeout||ms('10s') }, (err) =>{
    if(closed==false)error(err)
  })
  
  let l = packr.pack(local||{})
  const shake = stream.handshake
  if (!isListener) {
    const buf = Buffer.alloc(4)
    buf.writeUInt32BE(l.length, 0)
    shake.write(Buffer.concat([buf, Buffer.from(l)]))
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
        meta = packr.unpack(data)
        if (!_.isPlainObject(meta)) return error(true)
      } catch (e) {
        return error(e)
      }
      if (isListener) {
        const buf = Buffer.alloc(4)
        buf.writeUInt32BE(l.length, 0)
        shake.write(Buffer.concat([buf, Buffer.from(l)]))
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

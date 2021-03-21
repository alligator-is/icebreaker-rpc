const { Packr, addExtension } = require('msgpackr/pack');
const { getPosition, Unpackr, clearSource } = require('msgpackr/unpack')
const mread = require('msgpackr/unpack').read
const Through = require("pull-through")
const _ = require("icebreaker")

function isString(s) {
  return 'string' === typeof s
}

var GOODBYE = 'GOODBYE'

function encode(options) {
  options = options || {}
  options.sequential = true
  const packr = new Packr(options)

  return Through(function (c) {
    if (isString(c) && c === GOODBYE) {
      this.queue(packr.pack(null))
      return;
    }
    this.queue(packr.pack(c))
  })
}

 function decode(options) {
  var buffer = null
  options = options || {}
  options.objectMode = true
  options.structures = options.structures||[]
  options.sequential = true
  let unpackr = new Unpackr(options)

  return Through(function (chunk) {
    let position = 0
        let size = chunk?chunk.length:0
        if (buffer) {
          chunk = Buffer.concat([buffer, chunk])
          buffer = null
        }
    try {
    
      let r = unpackr.unpack(chunk, size, true)
      this.queue(r) 
      if(r==null){
        this.queue(GOODBYE)
        clearSource()
        buffer = null
        unpackr = null
        return;
      }
      if(!getPosition)return;
      position = getPosition()
      while(position < size) {
        let value = mread()
        this.queue(value)
        position = getPosition()
      }
    }catch(err){
      if (err.incomplete) buffer = chunk.slice(position)
      else throw err
    }
  })

 }

 var isBrowser = require('is-in-browser').default;
if(!isBrowser){
 exports = module.exports = function (stream) {
  let decoder = decode()
  return {
    source:_( stream.source,encode(),_.map(function(chunk){
      if(chunk && !Buffer.isBuffer(chunk)) chunk = Buffer.from(chunk)
      return chunk
    })),
    sink: _(_.map(function(chunk){
      if(chunk && !Buffer.isBuffer(chunk)) chunk = Buffer.from(chunk)
      return chunk
    }),decoder,stream.sink)
  }
}}
else
exports = module.exports = function (stream) {
    let decoder = decode()
    return {
      source:_( stream.source,encode()),
      sink: _(decoder,stream.sink)
    }
  }
exports.decode = decode
exports.encode = encode
exports.addExtension = addExtension
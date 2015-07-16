var _ = require('icebreaker')
require('icebreaker-peer-net')
require('./')
var test = require('tape')
var count = 0

var peer1 = _.peers.net({
  port: 5680
})

test('rpc', function (t) {
  t.plan(20)

  var rpc1 = _.rpc({
    name: 'test1',
    version: '1.0.0',
    manifest: {
      hello2: 'async'
    },
    permissions:{allow: ['hello2']},
    api: {
      hello2: function (v, cb) {
        t.equals(v, 'hello2')
        cb(null, 'world2')
      }
    },
    onRpc: function (rpc) {
      t.equals(rpc.name, 'test2')
      t.equals(rpc.version, '1.0.0')
      rpc.api.hello('hello', function (err, value) {
        t.notOk(err)
        t.equals(value, 'world')
        count++
        if (count === 4) {
          peer2.stop()
          peer1.stop()
          t.end()
        }
      })
    }
  })

  rpc1.use(peer1)

  peer1.on('started', function () {
    peer1.connect({
      address: peer2.address,
      port: peer2.port
    })
  })

  peer1.start()

  var peer2 = _.peers.net({
    port: 5687
  })
  var perms = _.rpc.permissions({allow:['hello']})
  var rpc2 = _.rpc({
    name: 'test2',
    version: '1.0.0',
    manifest: {
      hello: 'async'
    },
    permissions:perms,
    api: {
      hello: function (v, cb) {
        t.equals(v, 'hello')
        cb(null, 'world')
      }
    },
    onRpc: function (rpc) {
      t.equals(rpc.name, 'test1')
      t.equals(rpc.version, '1.0.0')
      rpc.api.hello2('hello2', function (err, value) {
        t.notOk(err)
        t.equals(value, 'world2')
        count++
        if (count === 4) {
          peer2.stop()
          peer1.stop()
          t.end()
        }
      })
    }
  })

  rpc2.use(peer2)

  peer2.on('started', function () {
    peer2.connect({
      address: peer1.address,
      port: peer1.port
    })
  })

  peer2.start()
})

test('no buffer attack',function(t){
  var p1 = _.peers.net()
  var A = _.rpc({name:'A',version:'1.0.0'})

  A.use(p1)

  var count=0
  var p2 = _.peers.net({
    port: 5687
  })

  function onDisconnected(){
    t.ok(Object.keys(this.connections).length===0)
    count++
    if(count ===2){ p1.stop() }
  }

  p1.on('disconnected',onDisconnected)
  p1.on('stopped',function(){
    t.end()
  })

  p1.start()

  p2.connect(p1)
  p2.on('connection',function(c){
    _(['test','test'],c,_.drain())
  })
  p2.on('disconnected',onDisconnected)
})

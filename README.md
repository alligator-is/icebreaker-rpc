icebreaker-rpc
============
[muxrpc](https://github.com/ssbc/muxrpc) for [icebreaker-peer](https://github.com/alligator-io/icebreaker-peer) implementations.

[![Build Status](https://travis-ci.org/alligator-io/icebreaker-rpc.svg?branch=master)](https://travis-ci.org/alligator-io/icebreaker-rpc)
## Install
```bash
npm install --save icebreaker-rpc
```

## Example

```javascript
const { Server, Connect, Async, Sync, AsyncPromise, Source, Sink, Local, KeyPair, _ } = require('./')

const alice = KeyPair.generate()
const bob = KeyPair.generate()

const api = Local()

api.helloAsync = Async((text, cb) => { cb(false, text + " world") }, "string")

api.helloPromise = AsyncPromise((text) => {
  return new Promise((resolve, reject) => { resolve(text + ' world') }, "string")
})

api.helloSink = Sink((cb) => { return _.drain((item) => { console.log("hello " + item) }, cb) })

// create Server

let server = Server(api, { keys: alice, appKey: "icebreaker@example" })
server.listen('shs+tcp://127.0.0.1:8080')

_(
  server,
  server.on({
    ready: (e) => {
      // create client connection
      Connect(e.address[0], null, { keys: bob, appKey: "icebreaker@example" }, (err, connection) => {
        console.log("hallo", connection)
        connection.peer.helloAsync("hello", (err, data) => {
          console.log(err, data) 
          connection.peer.helloPromise("hello").then((data) => {
            console.log(data)
            _("sink", api.helloSink(function () {
              server.end()
             }))
          })
        })
      })
    }, 
    end: () => { console.log("end") }
  }))

```

## License
MIT

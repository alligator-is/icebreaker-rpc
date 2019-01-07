
var test = require('tape')

const { Server,Connect,Local, Async,KeyPair,_} = require("../")

const local = Local()

local.test = Async(function(cb){
    cb(null,true)
})

const alice = KeyPair.generate()
const bob = KeyPair.generate()

test('Server tcp', function (t) {
  t.plan(2)
    const server=Server(local,{keys:alice,appKey:"alligator"})
    server.listen("shs+tcp://localhost:2222")

    _(server,server.on({
        ready:(e)=> {
            Connect(e.address[0],null,{keys:bob,appKey:"alligator"},function(err,connection){
                connection.peer.test((err,data)=>{
                    t.notOk(err)
                    t.equals(data,true)
                    server.end();
                })
            })
        }, 
        end:t.end 
        }
    ))  
})
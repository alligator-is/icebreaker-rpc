
var test = require('tape')

const { Server, Connect, Local, Async, Sync, KeyPair, _ } = require("../")

const local = Local()

local.test = Async((cb) => cb(null, true))

local.notAllowed = Sync(() => false)

const alice = KeyPair.generate()
const bob = KeyPair.generate()

test('Server tcp', function (t) {
    t.plan(8)
    const server = Server(local, {
        keys: alice, appKey: "alligator", perms: (id, cb) => {
            t.ok(id)
            cb(null, { allow: ["test"] })
        }
    })

    server.listen("shs+tcp://localhost:2222")
    let c = 0
    _(server, server.on({
        ready: (e) => {
            Connect(e.address[0], local, { keys: bob, appKey: "alligator",perms:(id,cb)=>{
                t.ok(id)
                cb(null, { allow: ["notAllowed"] })
            } }, (err, connection) => {
                connection.peer.test((err, data) => {
                    t.notOk(err)
                    t.equals(data, true)
                    connection.peer.notAllowed((err) => {
                        t.ok(err)
                        c++ 
                        if(c ==2)server.end();
                    })
                })
            })
        },
        connection:(connection)=>{
            connection.peer.test((err, data) => {
                t.ok(err)
                connection.peer.notAllowed((err,data) => {
                    t.notOk(err)
                    t.equals(data,false)
                    c++
                    if(c ==2)server.end();                 
                })
            })
        },
        end: t.end
    }
    ))
})
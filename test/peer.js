
var test = require('tape')

const { Peer, Local, Async, KeyPair, Sync, _ } = require("..")


const local = Local()

local.test = Async((cb) => cb(null, true))
local.notAllowed = Sync(() => false)

const alice = KeyPair.generate()
const bob = KeyPair.generate()


test('Peer tcp', function (t) {
    t.plan(5)

    const peerA = Peer(local, {
        keys: alice, appKey: "alligator", perms: (id, cb) => {
            t.ok(id)
            cb(null, { allow: ["test"] })
        }
    })
    peerA.listen("shs+tcp://localhost:5981")

    _(peerA, peerA.on({
        ready: (e) => {
            const peerB = Peer(local, { keys: bob, appKey: "alligator" })
            peerB.listen("shs+tcp://localhost:5980")

            _(peerB, peerB.on({
                ready: (e2) => {
                    peerB.connect(e.address[0], { appKey: "alligator" }, (err, connection) => {
                        connection.peer.test((err, data, d2) => {
                            t.notOk(err)
                            t.equals(data, true)
                            connection.peer.notAllowed((err) => {
                                t.ok(err)
                                peerB.end()
                            })


                        })
                    })
                },
                end: () => {
                    t.notOk()
                    peerA.end()
                }
            }
            ))

        },
        end: () => { t.end() }

    }
    ))


})


var test = require('tape')

const { Peer,Local, Async,KeyPair,_} = require("..")


const local = Local()

local.test = Async(function(cb){
    cb(null,true)
})

const alice = KeyPair.generate()
const bob = KeyPair.generate()


test('Peer tcp', function (t) {
    t.plan(3)
  
    const peerA=Peer(local,{keys:alice,appKey:"alligator"})
    peerA.listen("shs+tcp://localhost:5981")

    _(peerA,peerA.on({
        ready:(e)=> {

                const peerB=Peer(local,{keys:bob,appKey:"alligator"})
                peerB.listen("shs+tcp://localhost:5980")
                
                _(peerB,peerB.on({
                    ready:(e2)=> {
                        let conn = peerB.connect(e.address[0],{appKey:"alligator"},function(err,connection){
                            connection.peer.test((err,data,d2)=>{
                                t.notOk(err)
                                t.equals(data,true)
                                peerB.end();
                             
                            })
                        })
                    },
                    end:()=>{
                        t.notOk()
                        peerA.end()
                    } 
                }
                )) 
            
        },
        end:()=>{t.end()} 
                 
    }
    ))

     
})

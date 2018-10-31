
const { RPC, Local, Async, AsyncPromise, Sync, Source, Sink,Duplex } = require("..")
const _ = require('icebreaker')
const test = require('tape')

const local = Local()

local.async = Async(function (arg1, arg2, arg3, cb) {
    cb(null, "world")
}, ["number", "string", "boolean"])

local.async2 = Async(function (arg1, arg2, arg3, cb) { cb(new Error("testerror")) })

local.sync = Sync(function (arg1, arg2, arg3) {
    return "world"
}, ["number", "string", "boolean"])

local.sync2 = Sync(function () { throw new Error("testerror") })

local.promise = AsyncPromise(function () {
    return new Promise(function (resolve, reject) {
        resolve('hello world')
    })
}
)

local.promise2 = AsyncPromise(function () {
    return new Promise(function (resolve, reject) {
        reject(new Error("testerror"))
    })
}
)

local.deep = {}
local.deep.source = Source(function (opts) {
    return _(opts.name)
}, { input: { name: "string" } })

local.duplex = Duplex(function(){
    return _.pair()
})
let count = 0

local.deep.sink = Sink(function (opts, cb) {
    return _.drain(function (data) {
        if (data === 1 && opts.name === "sink") count++
    }, function (err) {
        if (cb) cb(err)
    })
}, { input: { name: "string" } })


let server
let remote

test("create server und client stream", (t) => {
    t.plan(2)
    server = RPC(local, { isClient: false }, (err, api) => {
        t.notOk(err)
    })
    let client = RPC(null, { isClient: true, id: "client" }, (err, api) => {
        t.notOk(err)
        remote = api
    })
    _(server, client, server)

})

test("async", (t) => {
    t.plan(2)
    remote.async(1, "hello", true, (err, data) => {
        t.notOk(err)
        t.equals(data, "world", data)
    })
})

test("async cb error", (t) => {
    t.plan(1)
    remote.async2(1, "hello", true, function (err, data) {
        t.equals(err.message, "testerror", err.message)
    })
})

test("async input error", (t) => {
    t.plan(1)
    remote.async(1, function (err, data) { t.ok(err.message, err.message) })
})


test("promise", (t) => {
    t.plan(2)

    remote.promise(1, "hello", true).then(function (data) {
        t.ok(data)
        t.ok(data)

    })
        .catch((err) => {
            t.end(err)
        })
})

test("promise reject error", (t) => {
    t.plan(1)
    remote.promise2(1, "hello", true).catch((err) => {
        t.equals(err.message, "testerror", err.message)
    })
});


test("sync", (t) => {
    t.plan(2)
    remote.sync(1, "hello", true, function (err, data) {
        t.notOk(err)
        t.equals(data, "world", data)
    })
})

test("sync cb error", (t) => {
    t.plan(1)
    remote.sync2(1, "hello", true, function (err, data) {
        t.equals(err.message, "testerror", err.message)
    })
})

test("sync input error", (t) => {
    t.plan(1)
    remote.sync(1, function (err, data) { t.ok(err.message, err.message) })
})

test("source", (t) => {
    t.plan(2)
    _(remote.deep.source({ name: "source" }), _.drain(function (data) {
        t.equals(data, "source")
    }, function (err) {
        t.notOk(err)

    }))
})

test("source input error", (t) => {
    t.plan(1)
    _(remote.deep.source(1), _.onEnd(function (err) {
        t.ok(err.message, err.message)
    }))
})

test("sink", (t) => {
    t.plan(2)
    _(1, remote.deep.sink({ name: "sink" }, function (err) {
        t.notOk(err)
        t.equal(count, 1)
    }))
})

test("sink input error", (t) => {
    t.plan(1)
    _(1, remote.deep.sink({ "test": 2 }, function (err, data) {
        t.ok(err.message, err.message)
    }))
})

test("sink error", (t) => {
    t.plan(1)
    _(_.error(new Error("error")), remote.deep.sink({ "name": "sink" }, function (err) {
        t.ok(err.message, err.message)
    }))
})


test("duplex", (t) => {
    t.plan(5)
    const duplex = remote.duplex()
    _([1,2,3,4],duplex,_.drain((item)=>{
        t.ok(item,item)
    },function(err){
        t.notOk(err);
    }))
    
})



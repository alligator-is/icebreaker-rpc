const traverse = require('traverse');
const clone = traverse.clone
const _ = require('icebreaker')
const { Async,AsyncPromise, Sync, Source, Sink,Duplex } = require("../")

module.exports = function Remote(manifest, remoteCall) {
  const remote = clone(manifest)
  
  traverse(remote).forEach(function (v) {
    if (_.isPlainObject(v) && v.type) {
      const path = this.path
      
      if (v.type === "async") this.update(Async((...args) => { return remoteCall(v.type, path, args) }, v))
      else if (v.type === "promise") this.update(AsyncPromise((...args) => {  return remoteCall(v.type,path,args) }, v));
      else if (v.type === "sync") this.update(Sync((...args) => { return remoteCall(v.type, path, args) }, v))  
      else if (v.type === "source") this.update(Source((...args) => { return remoteCall(v.type, path, args) }, v))
      else if (v.type === "sink") this.update(Sink((...args) => {  return remoteCall(v.type,path,args) }, v));
      else if (v.type === "duplex") this.update(Duplex((...args) => {  return remoteCall(v.type,path,args) }, v));
      else this.delete(v)
    }
  })

  return remote;
}
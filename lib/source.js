const _ = require('icebreaker')
const Sync = require("./sync")

module.exports = function Source(func, opts, defaults) {
    const sync = Sync(func, opts, defaults)
 
    const source = function(...args){
        try { return sync.call(this,...args) }
        catch (err) {
            return _.error(err)
        }
    }

    Object.assign(source, sync)

    source.type = "source"

    return source
}
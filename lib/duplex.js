const _ = require('icebreaker')
const Sync = require("./sync")

module.exports = function Duplex(func,opts,defaults){
    const sync = Sync(func,opts,defaults)
    const duplex = function(...args){
        try{ return sync.call(this,...args) }
        catch(err){ return {source:_.error(err),sink:(read) => {
            read(err || true, (_err) => { })
          }} }
    }
    
    Object.assign(duplex,sync)

    duplex.type="duplex"
    return duplex
}

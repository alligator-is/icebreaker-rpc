var u = require('./utils')

function Tree() {
  var isPlainObject = u.isPlainObject
  var isEmpty =u.isEmpty
  var rpcs = {}
  var tree = {}

  return {
    add: function (rpc) {
      var id = rpc.id;
      var name = rpc.name;
      var version = rpc.version;
      rpcs[id] = rpc
      if (!tree[name])
        tree[name] = {}
      if (!tree[name][version]) tree[name][version] = {};
      tree[name][version][id] = rpcs[id]
    },

    has: function (api) {
      if (!isPlainObject(api)) return false
      var name = api.name,
        version = api.version;
      return tree[name] && tree[name][version] && !isEmpty(tree[name][version])
    },

    get: function (api) {
      if (this.has(api)) {
        return tree[api.name][api.version]
      }
    },

    del: function (id) {
      var rpc = rpcs[id];

      if (isPlainObject(rpc)) {
        var name = rpc.name;
        var version = rpc.version;

        if (isPlainObject(tree[name])) {
          if (isPlainObject(tree[name][version])) {
            if (tree[name][version][id]!=null) {
              delete tree[name][version][id]
            }

            if (isEmpty(tree[name][version])) {
              delete tree[name][version]
            }
          }

          if (isEmpty(tree[name])) {
            delete tree[name]
          }
        }
      }

      delete rpcs[id];
      return rpc
    }
  }
}

module.exports=function() {
  var tree = Tree(), get = tree.get, del = tree.del, robin = {}

  tree.get = function (api) {
    var version = api.version
    var name = api.name
    var arr = get.call(this, api)
    if (arr) {
      if (!robin[name]) robin[name] = {}
      var keys = Object.keys(arr);
      var pos = robin[name][version]
      if(pos >=keys.length||pos===-1||pos == null)pos=0
      robin[name][version] = pos+1
      return arr[keys[pos]]
    }
  }

  tree.del = function (id) {
    var rpc = del.call(this, id)
    if(rpc){
      var name = rpc.name
      var version = rpc.version
      if(robin[name]){
        if(tree[name] && !tree[name][version])delete robin[name][version]
        if(!tree[name] && robin[name])delete robin[name]
      }
    }
  }

  return tree
}

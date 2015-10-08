var $builtinmodule = function() {
  "use strict";
  var mod = {};
  var students = [2,4,4,4,5,5,7,9]
  var math = {
    max:     (list) => Math.max(...list),
    min:     (list) => Math.min(...list),
    count:   (list) => list.length,
    mean:    (list) => math.sum(list) / list.length,
    sum:     (list) => list.reduce((a,b) => a+b),
    std:     (list) => Math.sqrt(math.variance(list)),
    25:      (list) => math.percentile(list,0.25),
    50:      (list) => math.percentile(list,0.50),
    75:      (list) => math.percentile(list,0.75),
    variance:(list) => {
      var mean = math.mean(list)
      return math.sum(list.map((a) => Math.pow(a - mean,2)))/list.length
    },
    percentile: (list,p) => list.sort()[Math.floor(list.length * p)]
  }

  mod.read_csv = new Sk.builtin.func(function(name) {
    var $name = Sk.ffi.remapToJs(name);
    var $data = window.__load__($name)
    var $ret = Sk.misceval.callsimOrSuspend(mod.DataFrame,$data);
    return $ret;
  });
  mod.GroupBy = Sk.misceval.buildClass(mod, function($gbl, $loc) {
    $loc.__init__ = new Sk.builtin.func(function(self, data, groupby) {
      var $groupby = Sk.ffi.remapToJs(groupby)
      var group = {}
      data.forEach(d => {
        var key = d[$groupby]
        if (!group[key]) group[key] = [d]
        else             group[key].push(d)
      })
      self.$keys   = Object.keys(group)
      self.$group = group
    })
    $loc.__iter__ = new Sk.builtin.func(function(self,x) {
      var i = 0
      return { tp$iternext: function() {
        var $data = self.$group[self.$keys[i]]
        if ($data) {
          // this clusterfuck is to try and make a ( book, data_frame ) for the loop
          // i know there's a simpler way but backed myself into this - remove duct tape soon
          var $list = new Sk.builtins['list']([new Sk.builtin.int_(0),new Sk.builtin.int_(0)])
          var $key = new Sk.builtin.int_(+self.$keys[i]);
          Sk.abstr.objectSetItem($list, new Sk.builtin.int_(0), $key, true);
          var $data_frame = Sk.misceval.callsimOrSuspend(mod.DataFrame,$data)
          Sk.abstr.objectSetItem($list, new Sk.builtin.int_(1), $data_frame, true);
          i++
          return $list
        }
      }}
    })
  })
  mod.DataFrame = Sk.misceval.buildClass(mod, function($gbl, $loc) {
    $loc.__init__ = new Sk.builtin.func(function(self,data) {
      if (data.length > 0) {
        self.$vals = {}
        self.$keys = Object.keys(data[0])
        self.$keys.forEach(k => {
          self.$vals[k] = data.map(d => d[k])
          Sk.abstr.sattr(self, k, Sk.builtin.list(self.$vals[k]), true);
        })
      }
      self.$data = data
    });
    $loc.groupby = new Sk.builtin.func(function(self,group) {
      return Sk.misceval.callsimOrSuspend(mod.GroupBy,self.$data,group);
    });
    $loc.describe = new Sk.builtin.func(function(self,x) {
      var summary = {
        rows: ["count","mean","std","min","25","50","75","max"],
        cols: self.$keys,
        data: {}
      }
      summary.rows.forEach(func => {
        summary.data[func] = {}
        summary.cols.forEach(k => summary.data[func][k] = math[func](self.$vals[k]))
      })
      return Sk.ffi.remapToPy(summary)
    });
    $loc.__iter__ = new Sk.builtin.func(function(self,x) {
      var i = 0
      return { tp$iternext: function() {
        var $tuple = self.$data[i]
        if ($tuple) {
          i++
          return Sk.ffi.remapToJs(Object.keys($tuple).map(k => $tuple[k]))
        }
      }}
    })
 },'DataFrame', []);
 return mod
}

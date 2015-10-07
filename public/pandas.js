var $builtinmodule = function() { 
  "use strict";
  var mod = {};
  mod.read_csv = new Sk.builtin.func(function(name) {
    var $ret = Sk.misceval.callsimOrSuspend(mod.DataFrame,name);
    return $ret;
  });
  mod.DataFrame = Sk.misceval.buildClass(mod, function($gbl, $loc) {
    $loc.__init__ = new Sk.builtin.func(function(self,name) {
      self.$name = Sk.ffi.remapToJs(name);
      // load the file -> store as data here
      self.$data = window.__load__(self.$name)      
    });
    $loc.describe = new Sk.builtin.func(function(self,x) {
      // returning $data as a python object
      return Sk.ffi.remapToPy(self.$data)
    });
 },'DataFrame', []);
 return mod
}

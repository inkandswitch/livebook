var $builtinmodule = function() {
  "use strict";
  var mod = {};
  var makefunc = function(module,name,varnames,func) {
    var f = function(kwa,q) {
      Sk.builtin.pyCheckArgs(name, arguments, 0, Infinity, true, false)
      var args = new Sk.builtins['tuple'](Array.prototype.slice.call(arguments, 1)); /*vararg*/
      var kwargs = new Sk.builtins['dict'](kwa);
      return func(args,kwargs)
    }
    f["co_kwargs"] = true
    f["co_name"] = name
    f["co_varnames"] = varnames
    module[name] = new Sk.builtin.func(f)
  }
  makefunc(mod,"legend",["ncol","frameon","fancybox","bbox_to_anchor"],function(args,kwargs) {
    return 1009;
  })
  makefunc(mod,"figure",["figsize","color"],function(args,kwargs) {
    return 1010;
  })
  makefunc(mod,"plot",["color","alpha","lw","label"],function(args,kwargs) {
    var $args = Sk.ffi.remapToJs(args)
    if ($args[0] == "black") return
    console.log("PLOT",$args,kwargs);
    window.__plot__($args[0],$args[1])
  });
  mod.xlim = new Sk.builtin.func(function(self,a,b,c) {
    return 100
  })
  mod.ylim = new Sk.builtin.func(function(self,a,b) {
    return 100
  })
  mod.xticks = new Sk.builtin.func(function(self,a,b) {
    return 100
  })
  mod.yticks = new Sk.builtin.func(function(self,a,b) {
    return 100
  })
  mod.Stack = Sk.misceval.buildClass(mod, function($gbl, $loc) {
    $loc.__init__ = new Sk.builtin.func(function(self) {
      self.stack = [];
    });
    $loc.push = new Sk.builtin.func(function(self,x) {
      self.stack.push(x);
    });
    $loc.pop = new Sk.builtin.func(function(self) {
      return self.stack.pop();
    });
  },'Stack', []);
  return mod
}

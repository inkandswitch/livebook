var $builtinmodule = function() { 
 console.log("creating matplotlib")
 var mod = {};
 var myfact = function(n) {
   if(n < 1) return 1;
   else return n * myfact(n-1);
 }
 mod.fact = new Sk.builtin.func(function(a) {
   return myfact(Sk.ffi.remapToJs(a));
 });
 mod.Stack = Sk.misceval.buildClass(mod, function($gbl, $loc) {
   $loc.__init__ = new Sk.builtin.func(function(self) {
     console.log("__init__")
     self.stack = [];
   });
   $loc.push = new Sk.builtin.func(function(self,x) {
     console.log("push")
     self.stack.push(x);
   });
   $loc.pop = new Sk.builtin.func(function(self) {
     console.log("pop")
     return self.stack.pop();
   });
 },'Stack', []);
 return mod
}

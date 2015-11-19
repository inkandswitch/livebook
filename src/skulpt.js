var sk1 = require("!!raw!lib/skulpt.js")
var sk2 = require("!!raw!lib/skulpt-stdlib.js")

eval(sk1)
eval(sk2)

if ( typeof module !== "undefined" ) { module.exports = Sk; }

var fs = require('fs')

var sk  = fs.readFileSync("./skulpt/lib/skulpt.js")
var sku = fs.readFileSync("./skulpt/lib/skulpt-stdlib.js")

var a = eval(sk.toString())
var b = eval(sku.toString())

var pyLoad = function(a) {
//  console.log("trying to load",a)
  if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][a] === undefined) {
//    console.log("LOAD",a,"not found")
    throw new Error("File not found: '" + a + "'");
  }
  console.log("LOAD:",a)
  return Sk.builtinFiles["files"][a];
}

Sk.configure({
  output: text => { if (text != "\n") console.log("LOG:",text) },
  read: pyLoad,
});

goog.global.eval = eval

var files

function load_py(dir) {
  if (!fs.statSync(dir.join('/')).isDirectory()) return
  fs.readdirSync(dir.join('/')).forEach((file) => {
    var subdir = dir.concat([file])
    if (file.match(/\.(py|js)$/)) {
      files.push(subdir.slice(1).join('/'))
    } else {
      load_py(subdir)
    }
  })
}

function generate_pyload() {
  files = []
  load_py(["skulpt","src"])
  files.forEach(file => {
    // console.log("preloading file " + file)
    Sk.builtinFiles["files"][file] = fs.readFileSync("./skulpt/" + file).toString()
  })
}

generate_pyload()


var code = Sk.importMainWithBody("<stdin>", false, "import test as t\n\n" + "t.run()\n")



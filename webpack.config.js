var fs = require("fs")

var files = []

function load_py(dir) {
  fs.readdirSync(dir.join('/')).forEach((file) => {
    var subdir = dir.concat([file])
    if (file.match(/\.py$/)) {
      files.push(subdir.slice(1).join('/'))
    } else {
      load_py(subdir)
    }
  })
}

load_py(["skulpt"])

var body = [ "var f = []",""]
files.forEach((file) => body.push('Sk.builtinFiles["files"]["' + file + '"] = require("raw!' + file  + '");'))
body.push('')
files.forEach((file) => body.push('f.push("' + file + '")'))
body.push('')
body.push('module.exports = { files: f }')
fs.writeFileSync("src/pyload.js", body.join("\n"))
console.log("imported skulpt files",files)

module.exports = {
    entry: "./src/index.js",
    output: {
        path: "public",
        filename: "bundle.js"
    },
    resolve: {
      modulesDirectories: ["web_modules", "node_modules"],
      fallback: ["skulpt"],
      extensions: ["", ".js", ".jsx"]
    },
    module: {
        loaders: [
            { test: /\.css$/, loader: "style!css" },
            { test: /\.jsx?$/, exclude: /(node_modules|bower_components)/, loader: 'babel' }
        ]
    }
};

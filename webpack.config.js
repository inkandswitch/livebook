module.exports = {
    entry: { notebook: "./src/index.js", worker: "./src/worker.js"},
    output:
      { path: "public/js", filename: "[name].js" },
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

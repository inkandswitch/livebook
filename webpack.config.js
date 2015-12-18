var CopyWebpackPlugin = require('copy-webpack-plugin');
var path = require('path');


module.exports = {
    entry: { notebook: "./src/index.js", worker: "./src/worker.js"},

    output:
      { path: "public", filename: "js/[name].js" },

    resolve: {
      modulesDirectories: ["web_modules", "node_modules"],
      extensions: ["", ".js", ".jsx"]
    },

    module: {
        loaders: [
            { test: /\.css$/, loader: "style!css" },
            {
              test: /\.jsx?$/, 
              exclude: /(node_modules|bower_components)/, 
              loader: 'babel',
              presets: ['stage-2'],
            }
        ]
    },

    plugins: [
      new CopyWebpackPlugin([
        { from: 'sample-notebooks', to: "forkable", },
      ]),

    ],
};

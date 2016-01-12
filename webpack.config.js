var CopyWebpackPlugin = require('copy-webpack-plugin');
var path = require('path');

module.exports = {
    entry: {
      notebook: "./src/notebook.jsx",
      worker: "./src/worker.js"
    },

    output: {
      path: "public", 
      filename: "js/[name].js" 
    },

    resolve: {
      modulesDirectories: ["web_modules", "node_modules"],
      extensions: ["", ".js", ".jsx"]
    },

    module: {
      loaders: [
        {
          test: /\.jsx?$/, 
          exclude: /(node_modules|bower_components)/, 
          loader: 'babel',
          presets: ['stage-2'],
        },
        {
          test: /\.css$/, 
          loader: "style-loader!css-loader",
        },
        {
          test: /\.scss$/,
          loaders: ["style", "css", "sass"],
        },
        {
          test: /\.png$/, 
          loader: "url-loader?limit=100000"
        },
      ]
    },

    plugins: [
      new CopyWebpackPlugin([
        { from: 'sample-notebooks', to: "forkable", },
      ]),

    ],
};

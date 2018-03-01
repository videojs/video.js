const path = require('path');
const webpack = require('webpack');
const pkg = require('../package.json');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');
const base = path.resolve(__dirname, '..');

module.exports = function(env, argv) {
  return {
    entry: path.resolve(base, 'src', 'js', 'video.js'),
    performance: {
      // by default webpack will warn you if your filesize is too
      // large, This happens a lot in the development build as it
      // is not "optimized". So we turn if off there and set it to
      // the default value "warning" otherwise.
      hints: argv.mode === 'development' ? false : 'warning'
    },
    // used by webpack-dev-server to determine where content
    // should be served from
    devServer: {contentBase: base},

    output: {
      filename: argv.mode === 'development' ? 'video.js' : 'video.min.js',
      path: path.resolve(base, 'dist'),
      library: 'videojs',
      libraryTarget: 'umd',
      // since we export default in videojs
      libraryExport: 'default'
    },
    externals: {
      'global/window': 'window',
      'global': 'window',
      'global/document': 'document'
    },
    optimization: {
      minimizer: [
        // skip license comment
        new UglifyJsPlugin({uglifyOptions: {output: {comments: /^!/}}})
      ]
    },
    plugins: [
      new webpack.BannerPlugin(`@name ${pkg.name}, @version ${pkg.version}, @license ${pkg.license}`),
      // webpack-dev-server does not write files to disk by default.
      // This plugin writes those files to disk and only workes when webpack is run via
      // webpack-dev-server
      new WriteFilePlugin()
    ]
  };
};

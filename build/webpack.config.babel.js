import path from 'path';

export default [{
  entry: './src/js/video.js',
  output: {
    path: path.resolve(__dirname, '..', 'dist'),
    filename: './video.js',
    library: 'videojs',
    libraryTarget: 'umd',
    libraryExport: 'default'
  },
  performance: {
    hints: false
  },
  optimization: {
    minimize: false
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['es2015', {modules: false, loose: true}]]
          }
        }
      }
    ]
  }
}, {
  entry: './src/js/video.js',
  output: {
    path: path.resolve(__dirname, '..', 'dist'),
    filename: './video.min.js',
    library: 'videojs',
    libraryTarget: 'umd',
    libraryExport: 'default'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['es2015', {modules: false, loose: true}]]
          }
        }
      }
    ]
  }
}, {
  entry: './src/js/video.js',
  output: {
    path: path.resolve(__dirname, '..', 'dist'),
    filename: './video.cjs.js',
    library: 'videojs',
    libraryTarget: 'commonjs',
    libraryExport: 'default'
  },
  externals: [
    'tsml',
    'videojs-vtt.js',
    'xhr',
    'safe-json-parse'
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['es2015', {modules: false, loose: true}]]
          }
        }
      }
    ]
  }
}];

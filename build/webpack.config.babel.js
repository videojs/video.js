import path from 'path';

export default [{
  entry: './src/js/index.js',
  output: {
    path: path.resolve(__dirname, '..', 'dist'),
    filename: './video.js',
    library: 'videojs',
    libraryTarget: 'umd',
    libraryExport: 'default'
  },
  resolve: {
    alias: {
      'video.js': path.resolve(__dirname, '..', 'src', 'js', 'bundle.js')
    }
  },
  performance: {
    hints: false
  },
  optimization: {
    minimize: false
  }
}, {
  entry: './src/js/index.js',
  output: {
    path: path.resolve(__dirname, '..', 'dist'),
    filename: './video.min.js',
    library: 'videojs',
    libraryTarget: 'umd',
    libraryExport: 'default'
  },
  resolve: {
    alias: {
      'video.js': path.resolve(__dirname, '..', 'src', 'js', 'bundle.js')
    }
  }
}, {
  entry: './src/js/index.js',
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
  resolve: {
    alias: {
      'video.js': path.resolve(__dirname, '..', 'src', 'js', 'bundle.js')
    }
  }
}];

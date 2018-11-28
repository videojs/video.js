const generate = require('videojs-generate-karma-config');

module.exports = function(config) {
  const coverageFlag = process.env.npm_config_coverage;
  const reportCoverage = false; // process.env.TRAVIS || coverageFlag || false;

  // see https://github.com/videojs/videojs-generate-karma-config
  // for options
  const options = {
    serverBrowsers(defaults) {
      return [];
    },
    coverage: reportCoverage
  };

  config = generate(config, options);

  config.files = [
    'node_modules/es5-shim/es5-shim.js',
    'node_modules/es6-shim/es6-shim.js',
    'node_modules/sinon/pkg/sinon.js',
    'dist/video-js.css',
    'test/dist/bundle.js',
    'build/temp/browserify.js',
    'build/temp/webpack.js',
  ];

  config.browserStack.project = 'Video.js';
};

const generate = require('videojs-generate-karma-config');

module.exports = function(config) {
  // const coverageFlag = process.env.npm_config_coverage;
  // process.env.TRAVIS || coverageFlag || false;
  const reportCoverage = false;

  // see https://github.com/videojs/videojs-generate-karma-config
  // for options
  const options = {
    travisLaunchers(defaults) {
      delete defaults.travisFirefox;
      return defaults;
    },
    serverBrowsers(defaults) {
      return [];
    },
    coverage: reportCoverage
  };

  config = generate(config, options);

  config.proxies = config.proxies || {};

  // disable warning logs for sourceset tests, by proxing to a remote host
  Object.assign(config.proxies, {
    '/test/relative-one.mp4': 'http://example.com/relative-one.mp4',
    '/test/relative-two.mp4': 'http://example.com/relative-two.mp4',
    '/test/relative-three.mp4': 'http://example.com/relative-three.mp4'
  });

  config.files = [
    'node_modules/es5-shim/es5-shim.js',
    'node_modules/es6-shim/es6-shim.js',
    'node_modules/sinon/pkg/sinon.js',
    'dist/video-js.css',
    'test/dist/bundle.js',
    'test/dist/browserify.js',
    'test/dist/webpack.js'
  ];

  config.browserStack.project = 'Video.js';

  // pin Browserstack Firefox version to 64
  /* eslint-disable camelcase */
  config.customLaunchers.bsFirefox.browser_version = '64.0';
  /* eslint-enable camelcase */

  // uncomment the section below to re-enable all browserstack video recording
  // it is off by default because it slows the build
  /*
  Object.keys(config.customLaunchers).forEach(function(cl) {
    if ('browserstack.video' in config.customLaunchers[cl]) {
      config.customLaunchers[cl]['browserstack.video'] = "true";
    }
  });
  */

  /* eslint-disable no-console */
  // console.log(JSON.stringify(config, null, 2));
  /* eslint-enable no-console */

};

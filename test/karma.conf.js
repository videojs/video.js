const generate = require('videojs-generate-karma-config');
const CI_TEST_TYPE = process.env.CI_TEST_TYPE || '';

module.exports = function(config) {
  // see https://github.com/videojs/videojs-generate-karma-config
  // for options
  const options = {
    browsers(aboutToRun) {
      // never run on Chromium
      return aboutToRun.filter(function(launcherName) {
        return !(/^(Chromium)/).test(launcherName);
      });
    },
    serverBrowsers(defaults) {
      return [];
    },
    browserstackLaunchers(defaults) {
      // do not use browserstack for coverage testing
      if (CI_TEST_TYPE === 'coverage') {
        return {};
      }

      return defaults;
    },
    coverage: CI_TEST_TYPE === 'coverage' ? true : false
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
    // make sinon be available via karma's server but don't include it directly
    { pattern: 'node_modules/sinon/pkg/sinon.js', included: false, served: true },
    'test/sinon.js',
    'dist/video-js.css',
    'test/dist/bundle.js',
    'test/dist/browserify.js',
    'test/dist/webpack.js'
  ];

  config.browserStack.project = 'Video.js';

  // pin Browserstack Firefox version to 64
  /* eslint-disable camelcase */
  if (config.customLaunchers && config.customLaunchers.bsFirefox) {
    config.customLaunchers.bsFirefox.browser_version = '64.0';
  }
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

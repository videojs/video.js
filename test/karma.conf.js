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
    'dist/video-js.css',
    'test/globals-shim.js',
    'test/unit/**/*.js',
    'test/dist/browserify.js',
    'test/dist/webpack.js',
    {pattern: 'src/**/*.js', watched: true, included: false, served: false }
  ];

  config.browserStack.project = 'Video.js';

  config.frameworks.push('browserify');
  config.browserify = {
    debug: true,
    plugin: ['proxyquireify/plugin'],
    transform: [
      ['babelify', {presets: [['@babel/preset-env', {loose: true}]]}]
    ]
  };

  if (reportCoverage) {
    config.browserify.transform.push('browserify-istanbul');
  }

  config.preprocessors = {
    'test/globals-shim.js': ['browserify'],
    'test/unit/**/*.js': ['browserify']
  };

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
  console.log(JSON.stringify(config, null, 2));
  /* eslint-enable no-console */

};

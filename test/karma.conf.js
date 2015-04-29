module.exports = function(config) {
  var customLaunchers = {
    chrome_sl: {
      singleRun: true,
      base: 'SauceLabs',
      browserName: 'chrome',
      platform: 'Windows 8.1',
      version: '34'
    },

    firefox_sl: {
      singleRun: true,
      base: 'SauceLabs',
      browserName: 'firefox',
      platform: 'Linux',
      version: '29'
    },

    safari_sl: {
      singleRun: true,
      base: 'SauceLabs',
      browserName: 'safari',
      platform: 'OS X 10.8'
    },

    ipad_sl: {
      singleRun: true,
      base: 'SauceLabs',
      browserName: 'ipad',
      platform:'OS X 10.9',
      version: '7.1'
    },

    android_sl: {
      singleRun: true,
      base: 'SauceLabs',
      browserName: 'android',
      platform:'Linux'
    },

    ie_sl: {
      singleRun: true,
      base: 'SauceLabs',
      browserName: 'internet explorer',
      platform: 'Windows 8.1',
      version: '11'
    }
  };

  config.set({
    basePath: '',

    frameworks: ['browserify', 'qunit'],

    autoWatch: false,

    singleRun: true,

    files: [
      '../build/temp/video-js.min.css',
      '../build/temp/video.min.js',
      '../build/temp/tests.js',
    ],

    preprocessors: {
      '../test/unit/**/*.js': [ 'browserify' ]
    },

    browserify: {
      debug: true,
      transform: [ 'babelify', 'browserify-istanbul' ]
    },

    plugins: [
      'karma-qunit',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-ie-launcher',
      'karma-opera-launcher',
      'karma-phantomjs-launcher',
      'karma-safari-launcher',
      'karma-sauce-launcher',
      'karma-browserify',
      'karma-coverage'
    ],

    reporters: ['dots', 'coverage'],

    // web server port
    port: 9876,

    // cli runner port
    runnerPort: 9100,

    colors: true,

    logLevel: config.LOG_INFO,

    captureTimeout: 60000,

    sauceLabs: {
      startConnect: true,
      tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER,
      build: process.env.TRAVIS_BUILD_NUMBER,
      testName: process.env.TRAVIS_BUILD_NUMBER + process.env.TRAVIS_BRANCH,
      recordScreenshots: false
    },

    // The HTML reporter seems to be busted right now, so we're just using text in the meantime
    // along with the summary after the test run.
    coverageReporter: {
      reporters: [
        {
          type: 'text',
          dir: 'coverage/',
          file: 'coverage.txt'
        },
        {
          type: 'lcovonly',
          dir: 'coverage/',
          subdir: '.'
        },
        { type: 'text-summary' }
      ]
    }
  });
};

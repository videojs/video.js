module.exports = function(config) {
  var customLaunchers = {
    chrome_sl: {
      base: 'SauceLabs',
      browserName: 'chrome',
      platform: 'Windows 8.1'
    },

    firefox_sl: {
      base: 'SauceLabs',
      browserName: 'firefox',
      platform: 'Linux'
    },

    safari_sl: {
      base: 'SauceLabs',
      browserName: 'safari',
      platform: 'OS X 10.10'
    },

    ipad_sl: {
      base: 'SauceLabs',
      browserName: 'iPad',
      version: '8.2'
    },

    android_sl: {
      base: 'SauceLabs',
      browserName: 'Android'
    },

    ie_sl: {
      base: 'SauceLabs',
      browserName: 'internet explorer'
    }
  };

  config.set({
    basePath: '',

    frameworks: ['qunit'],

    autoWatch: false,

    singleRun: true,

    files: [
      // include and execute the standalone test bundle first
      '../build/temp/tests.js',

      // then include video.js through globals to run the API tests
      '../build/temp/video-js.min.css',
      '../build/temp/video.min.js',
      'api/api.js'
    ],

    plugins: [
      'karma-qunit',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-ie-launcher',
      'karma-opera-launcher',
      'karma-phantomjs-launcher',
      'karma-safari-launcher',
      'karma-sauce-launcher',
      'karma-coverage'
    ],

    reporters: ['dots', 'saucelabs', 'coverage'],

    // web server port
    port: 9876,

    // cli runner port
    runnerPort: 9100,

    colors: true,

    logLevel: config.LOG_INFO,

    captureTimeout: 60000,

    browserNoActivityTimeout: 60000,

    sauceLabs: {
      startConnect: false,
      tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER,
      build: process.env.TRAVIS_BUILD_NUMBER,
      testName: process.env.TRAVIS_BUILD_NUMBER + process.env.TRAVIS_BRANCH,
      recordScreenshots: false
    },
    customLaunchers: customLaunchers,

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

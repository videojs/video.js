module.exports = function(config) {
  // Creating settings object first so we can modify based on travis
  var settings = {
    basePath: '',

    frameworks: ['browserify', 'qunit'],
    autoWatch: false,
    singleRun: true,
    browsers: ['Chrome'],

    // Compling tests here
    files: [
      '../build/temp/video-js.css',
      '../test/globals-shim.js',
      '../test/unit/**/*.js',
      { pattern: '../src/**/*.js', watched: true, included: false, served: false }
    ],

    // Using precompiled tests
    // files: [
    //   '../build/temp/video-js.css',
    //   '../build/temp/tests.js'
    // ],

    preprocessors: {
      '../test/**/*.js': [ 'browserify' ]
    },

    browserify: {
      debug: true,
      transform: [
        require('babelify').configure({
          sourceMapRelative: './',
          loose: ['all']
        })
      ]
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

    reporters: ['dots', 'saucelabs'],

    // web server port
    port: 9876,

    // cli runner port
    runnerPort: 9100,
    colors: true,
    logLevel: config.LOG_INFO,
    captureTimeout: 60000,
    browserNoActivityTimeout: 60000,

    sauceLabs: {
      startConnect: true,
      tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER,
      build: process.env.TRAVIS_BUILD_NUMBER,
      testName: process.env.TRAVIS_BUILD_NUMBER + process.env.TRAVIS_BRANCH,
      recordScreenshots: false
    },
    customLaunchers: getCustomLaunchers(),

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
  };

  if (process.env.TRAVIS) {
    settings.browserify.transform.push('browserify-istanbul');
    settings.reporters.push('coverage');

    if (process.env.SAUCE_ACCESS_KEY) {
      settings.browsers = [
        'chrome_sl',
        'firefox_sl',
        'safari_sl',
        'ie_sl'
      ];
    } else {
      settings.browsers = ['Firefox'];
    }
  }

  config.set(settings);
};

function getCustomLaunchers(){
  return {
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
      platform: 'OS X 10.10'
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
}

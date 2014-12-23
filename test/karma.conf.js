var fs = require('fs'),
    vm = require('vm'),
    sourceLoader = fs.readFileSync('./build/source-loader.js', 'utf8');
    sandbox = {
      blockSourceLoading: true,
      document: {},
      window: {}
    };
    sourceFiles = [];


vm.runInNewContext(sourceLoader, sandbox, 'build/source-loader.js');
sourceFiles = sandbox.sourceFiles.map(function(src) {
  return '../' + src;
});

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

    frameworks: ['qunit', 'sinon'],

    autoWatch: false,

    singleRun: true,

    customLaunchers: customLaunchers,

    files: [
      '../build/files/video-js.css',
      '../test/karma-qunit-shim.js'
    ].concat(sourceFiles).concat([
      '../test/unit/**/*.js'
    ]),

    plugins: [
      'karma-qunit',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-ie-launcher',
      'karma-opera-launcher',
      'karma-phantomjs-launcher',
      'karma-safari-launcher',
      'karma-sauce-launcher',
      'karma-sinon'
    ],

    reporters: ['dots'],

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
    }
  });
};

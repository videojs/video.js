module.exports = function(config) {
  var customLaunchers = {
    chrome_sl: {
      singleRun: true,
      base: 'SauceLabs',
      browserName: 'chrome',
      platform: 'Windows 7',
      version: '34'
    },

    firefox_sl: {
      singleRun: true,
      base: 'SauceLabs',
      browserName: 'firefox',
      platform: 'Windows 8'
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
    }
  };

  config.set({
    basePath: '',

    frameworks: ['qunit', 'sinon'],

    autoWatch: false,

    singleRun: true,

    customLaunchers: customLaunchers,

    files: [
      '../test/karma-qunit-shim.js',
      "../src/js/core.js",
      "../src/js/core-object.js",
      "../src/js/events.js",
      "../src/js/lib.js",
      "../src/js/util.js",
      "../src/js/component.js",
      "../src/js/button.js",
      "../src/js/slider.js",
      "../src/js/menu.js",
      "../src/js/media-error.js",
      "../src/js/player.js",
      "../src/js/control-bar/control-bar.js",
      "../src/js/control-bar/live-display.js",
      "../src/js/control-bar/play-toggle.js",
      "../src/js/control-bar/time-display.js",
      "../src/js/control-bar/fullscreen-toggle.js",
      "../src/js/control-bar/progress-control.js",
      "../src/js/control-bar/volume-control.js",
      "../src/js/control-bar/mute-toggle.js",
      "../src/js/control-bar/volume-menu-button.js",
      "../src/js/control-bar/playback-rate-menu-button.js",
      "../src/js/poster.js",
      "../src/js/loading-spinner.js",
      "../src/js/big-play-button.js",
      "../src/js/error-display.js",
      "../src/js/media/media.js",
      "../src/js/media/html5.js",
      "../src/js/media/flash.js",
      "../src/js/media/loader.js",
      "../src/js/tracks.js",
      "../src/js/json.js",
      "../src/js/setup.js",
      "../src/js/plugins.js",
      '../test/unit/*.js'
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

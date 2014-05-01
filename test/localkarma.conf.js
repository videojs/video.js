module.exports = function(config) {
  config.set({
    frameworks: ['qunit'],

    autoWatch: false,

    singleRun: true,

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
      "../src/js/poster.js",
      "../src/js/loading-spinner.js",
      "../src/js/big-play-button.js",
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
      'karma-safari-launcher'
    ],

    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit'
    reporters: ['dots'],

    // web server port
    port: 9876,

    // cli runner port
    runnerPort: 9100,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000
  });
};

module.exports = function(config) {
  config.set({
    frameworks: ['qunit'],

    autoWatch: false,

    singleRun: true,

    files: [
      '../test/karma-qunit-shim.js',
      '../node_modules/sinon/pkg/sinon.js',
      '../build/files/minified.video.js',
      '../test/unit/test-helpers.js',
      '../test/unit/api.js'
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

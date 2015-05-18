module.exports = function(config) {
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

    browserNoActivityTimeout: 60000,

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

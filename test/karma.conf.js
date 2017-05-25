module.exports = function(config) {
  // Creating settings object first so we can modify based on travis
  var settings = {
    basePath: '',

    frameworks: ['browserify', 'qunit', 'detectBrowsers'],
    autoWatch: false,
    singleRun: true,

    // Compling tests here
    files: [
      '../build/temp/video-js.css',
      '../build/temp/ie8/videojs-ie8.js',
      '../test/globals-shim.js',
      '../test/unit/**/*.js',
      '../build/temp/browserify.js',
      '../build/temp/webpack.js',
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
      plugin: ['proxyquireify/plugin'],
      transform: ['babelify']
    },

    plugins: [
      'karma-qunit',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-ie-launcher',
      'karma-opera-launcher',
      'karma-safari-launcher',
      'karma-browserstack-launcher',
      'karma-browserify',
      'karma-coverage',
      'karma-detect-browsers',
    ],

    detectBrowsers: {
      enabled: false,
      usePhantomJS: false
    },

    reporters: ['dots'],

    // web server port
    port: 9876,

    // cli runner port
    runnerPort: 9100,
    colors: true,
    logLevel: config.LOG_INFO,
    captureTimeout: 300000,
    browserNoActivityTimeout: 300000,
    browserDisconnectTimeout: 300000,
    browserDisconnectTolerance: 3,

    browserStack: {
      name: process.env.TRAVIS_BUILD_NUMBER + process.env.TRAVIS_BRANCH,
      pollingTimeout: 30000,
      captureTimeout: 600,
      timeout: 600
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
    },

    // make QUnit show the UI in karma runs
    client: {
      clearContext: false,
      qunit: {
        showUI: true,
        testTimeout: 5000
      }
    }
  };

  // Coverage reporting
  // Coverage is enabled by passing the flag --coverage to npm test
  var coverageFlag = process.env.npm_config_coverage;
  var reportCoverage = process.env.TRAVIS || coverageFlag;
  if (reportCoverage) {
    settings.browserify.transform.push('browserify-istanbul');
    settings.reporters.push('coverage');
  }

  if (process.env.TRAVIS) {
    if (process.env.BROWSER_STACK_USERNAME) {
      settings.browsers = [
        'chrome_bs',
        'firefox_bs',
        'safari_bs',
        'edge_bs',
        'ie11_bs',
        'ie10_bs',
        'ie9_bs',
        'ie8_bs'
      ];
    } else {
      settings.browsers = ['Firefox'];
    }
  }

  config.set(settings);
};

function getCustomLaunchers(){
  return {
    chrome_bs: {
      base: 'BrowserStack',
      browser: 'chrome',
      os: 'Windows',
      os_version: '8.1'
    },

    firefox_bs: {
      base: 'BrowserStack',
      browser: 'firefox',
      os: 'Windows',
      os_version: '8.1'
    },

    safari_bs: {
      base: 'BrowserStack',
      browser: 'safari',
      os: 'OS X',
      os_version: 'Yosemite'
    },

    edge_bs: {
      base: 'BrowserStack',
      browser: 'edge',
      os: 'Windows',
      os_version: '10'
    },

    ie11_bs: {
      base: 'BrowserStack',
      browser: 'ie',
      browser_version: '11',
      os: 'Windows',
      os_version: '8.1'
    },

    ie10_bs: {
      base: 'BrowserStack',
      browser: 'ie',
      browser_version: '10',
      os: 'Windows',
      os_version: '7'
    },

    ie9_bs: {
      base: 'BrowserStack',
      browser: 'ie',
      browser_version: '9',
      os: 'Windows',
      os_version: '7'
    },

    ie8_bs: {
      base: 'BrowserStack',
      browser: 'ie',
      browser_version: '8',
      os: 'Windows',
      os_version: '7'
    }
  };
}

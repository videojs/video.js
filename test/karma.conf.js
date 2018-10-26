const generate = require('videojs-generate-karma-config');

module.exports = function(config) {

  // see https://github.com/videojs/videojs-generate-karma-config
  // for options
  const options = {
    browserStackLaunchers(defaults) {
      return Object.assign(defaults, {
        bsSafariElCapitan: {
          base: 'BrowserStack',
          browser: 'safari',
          os: 'OS X',
          os_version: 'El Capitan'
        }
      });
    },
    serverBrowsers(defaults) {
      return [];
    }

  };

  config = generate(config, options);

  config.files = [
    'dist/video-js.css',
    'test/globals-shim.js',
    'test/unit/**/*.js',
    'build/temp/browserify.js',
    'build/temp/webpack.js',
    {pattern: 'src/**/*.js', watched: true, included: false, served: false }
  ];

  config.frameworks.push('browserify');
  config.plugins.push('karma-browserify');
  config.browserify = {
    debug: true,
    plugin: ['proxyquireify/plugin'],
    transform: [
      ['babelify', {"presets": [["@babel/preset-env", {"loose": true}]]}],
      'browserify-istanbul'
    ]
  };


  config.preprocessors = {
    'test/**/*.js': [ 'browserify' ]
  };

  config.reporters = ['dots'];

};

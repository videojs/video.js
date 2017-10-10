var ghrelease = require('gh-release');
var currentChangelog = require('./current-changelog.js');
var safeParse = require('safe-json-parse/tuple');
var pkg = require('../package.json')
var minimist = require('minimist');

var args = minimist(process.argv.slice(2), {
  boolean: ['prerelease'],
  default: {
    prerelease: false
  },
  alias: {
    p: 'prerelease'
  }
});

var options = {
  owner: 'videojs',
  repo: 'video.js',
  body: currentChangelog(),
  assets: ['./dist/video-js-'+pkg.version+'.zip'],
  endpoint: 'https://api.github.com',
  auth: {
    username: process.env.VJS_GITHUB_USER,
    password: process.env.VJS_GITHUB_TOKEN
  }
};

var tuple = safeParse(process.env.npm_config_argv);
var npmargs = tuple[0] ? [] : tuple[1].cooked;

if (args.prerelease || npmargs.some(function(arg) { return /next/.test(arg); })) {
  options.prerelease = true;
}

ghrelease(options, function(err, result) {
  if (err) {
    console.error('Unable to publish release to github');
    console.error('err:', err);
    console.error('result:', result);
  } else {
    console.log('Publish release to github!');
  }
});

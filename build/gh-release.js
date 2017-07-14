var ghrelease = require('gh-release');
var currentChangelog = require('./current-changelog.js');
var safeParse = require('safe-json-parse/tuple');
var pkg = require('../package.json')

var options = {
  owner: 'videojs',
  repo: 'video.js',
  body: currentChangelog(),
  assets: ['./dist/videojs-'+pkg.version+'.zip'],
  endpoint: 'https://api.github.com',
  auth: {
    username: process.env.VJS_GITHUB_USER,
    password: process.env.VJS_GITHUB_TOKEN
  }
};

var tuple = safeParse(process.env.npm_config_argv);
var npmargs = tuple[0] ? [] : tuple[1].cooked;

if (npmargs.some(function(arg) { return /next/.test(arg); })) {
  options.prerelease = true;
}

ghrelease(options, function(err, result) {
  if (err) {
    console.log('Unable to publish release to github');
    console.log(err);
  } else {
    console.log('Publish release to github!');
    console.log(result);
  }
});

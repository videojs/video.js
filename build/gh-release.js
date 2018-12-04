/* eslint-disable no-console */

const ghrelease = require('gh-release');
const currentChangelog = require('./current-changelog.js');
const safeParse = require('safe-json-parse/tuple');
const pkg = require('../package.json');
const options = {
  owner: 'videojs',
  repo: 'video.js',
  body: currentChangelog(),
  assets: ['./dist/video-js-' + pkg.version + '.zip'],
  endpoint: 'https://api.github.com',
  auth: {
    username: process.env.VJS_GITHUB_USER,
    password: process.env.VJS_GITHUB_TOKEN
  }
};

let i = process.argv.length;

while (i--) {
  const arg = process.argv[i];

  if (arg === '-p' || arg === '--prerelease') {
    options.prerelease = true;
  }
}

const tuple = safeParse(process.env.npm_config_argv);
const npmargs = tuple[0] ? [] : tuple[1].cooked;

if (npmargs.some(function(arg) {
  return /next/.test(arg);
})) {
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

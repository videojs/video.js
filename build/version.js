var version = process.env.npm_package_version;
var prereleaseType = process.env.npm_config_arv['remain'][0];
var sh = require('shelljs');
var approvedTypes = {
  'major': 1,
  'minor': 1,
  'patch': 1
}

if (prereleaseType in approvedTypes) {
  sh.exec('npm run changelog');
}

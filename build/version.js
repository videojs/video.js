var version = process.env.npm_package_version;
console.log(process.env.npm_config_argv);
var prereleaseType = process.env.npm_config_argv['remain'][0];
var sh = require('shelljs');
var approvedTypes = {
  'major': 1,
  'minor': 1,
  'patch': 1
}

process.exit(1);
if (prereleaseType in approvedTypes) {
  sh.exec('npm run changelog');
}

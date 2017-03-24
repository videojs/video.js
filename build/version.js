var safeParse = require("safe-json-parse/tuple");
var tuple = safeParse(process.env.npm_config_argv);
var npm_config_argv = tuple[1]

if (tuple[0]) {
  process.exit(1);
}

var sh = require('shelljs');
var version = process.env.npm_package_version;
var prereleaseType = npm_config_argv['remain'][0];
var approvedTypes = {
  'major': 1,
  'minor': 1,
  'patch': 1
}

if (prereleaseType in approvedTypes) {
  sh.exec('npm run changelog');
}

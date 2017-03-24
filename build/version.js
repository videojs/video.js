var semver = require('semver');
var version = process.env.npm_package_version;
var execSync = require('child_process').execSync;

if (!semver.prerelease(version)) {
  execSync('npm run changelog');
}

const sh = require('shelljs');
const semver = require('semver');
const generateExample = require('./generate-example.js').generateExample;

const GIT_LOG = `git log --format=%B -n 1 ${process.env.COMMIT_REF}`;
const output = sh.exec(GIT_LOG, {async: false, silent: true}).stdout;

// if we're on master branch and not on a tagged commit,
// error the build so it doesn't redeploy the docs
if (process.env.BRANCH === 'master' && semver.valid(output.trim()) === null) {
  process.exit(1);

// if we're on any other branch, we can regenerate docs
} else {
  if (process.env.BRANCH !== 'master') {
    // generate the example
    generateExample();
  }

  // generate the docs
  sh.exec('npm run docs:api');

  // copy the legacy docs over
  sh.cp('-R', 'docs/legacy-docs', 'docs/api/docs');

}

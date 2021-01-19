const sh = require('shelljs');
const semver = require('semver');

const GIT_LOG = `git log --format=%B -n 1 ${process.env.COMMIT_REF}`;
const output = sh.exec(GIT_LOG, {async: false, silent: true}).stdout;

// if we're on main branch and not on a tagged commit,
// error the build so it doesn't redeploy the docs
if (process.env.BRANCH === 'main' && semver.valid(output.trim()) === null) {
  process.exit(1);
} else {
  sh.exec('npm run docs:api');
  sh.cp('-R', 'docs/legacy-docs', 'docs/api/docs');
}

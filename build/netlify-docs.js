const sh = require('shelljs');
const semver = require('semver');
const path = require('path');

const GIT_LOG = `git log --format=%B -n 1 ${process.env.COMMIT_REF}`;
const output = sh.exec(GIT_LOG, {async: false, silent: true}).stdout;

// if we're on main branch and not on a tagged commit,
// error the build so it doesn't redeploy the docs
if (process.env.BRANCH === 'main' && semver.valid(output.trim()) === null) {
  process.exit(1);
} else {
  sh.exec('npm run docs:api');
  sh.cp('-R', 'docs/legacy-docs', 'docs/api/docs');

  // move docs/_redirects into the root of the docs site
  //
  // this is needed because the root of the docs site is docs/api, which is not
  // in version control.
  const docsPath = path.join(__dirname, '..', 'docs');

  sh.cp(path.join(docsPath, '_redirects'), path.join(docsPath, 'api', '_redirects'));
}

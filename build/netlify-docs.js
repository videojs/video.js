const sh = require('shelljs');

const GIT_CONTAINS = `git tag --contains ${process.env.COMMIT_REF}`;

const output = sh.exec(GIT_CONTAINS, {async: false, silent:true}).stdout;

// if we're on master branch and not on a tagged commit,
// error the build so it doesn't redeploy the docs
if (process.env.BRANCH === 'master' && output === '') {
  process.exit(1);

// if we're on any other branch, we can regenerate docs
} else {
  // generate the docs
  sh.exec('npm run docs:api');

  // copy the legacy docs over
  sh.cp('-R', 'docs/legacy-docs', 'docs/api/docs');
}

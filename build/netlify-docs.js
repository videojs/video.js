const sh = require('shelljs');

const GIT_CONTAINS = `git tag --contains ${process.env.COMMIT_REF}`;
const DOCS = 'npm run docs:api';

const output = sh.exec(GIT_CONTAINS, {async: false, silent:true}).stdout;

// if we're on master branch, only generate docs if we're on a tagged commit
// if we're on any other branch, we can regenerate docs
if (process.env.BRANCH === 'master' && output !== '' ||
    process.env.BRANCH !== 'master') {
  // sh.exec(DOCS);
}

sh.rm('-rf', ['docs/api']);

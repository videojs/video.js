var sh = require('shelljs');

// delete the old directory
sh.rm('-rf', ['docs/api']);

// prepare the directory again
sh.mkdir('-p', 'docs/api');

// copy the legacy docs over
sh.cp('-R', 'docs/legacy-docs', 'docs/api/docs');

['REPOSITORY_URL', 'BRANCH', 'PULL_REQUEST', 'HEAD', 'COMMIT_REF', 'CONTEXT'].forEach(function(e) {
  console.log(e, ': ', process.env[e]);
});

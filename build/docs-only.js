const sh = require('shelljs');
const path = require('path');

module.exports = function(commit, commitRange) {
  const SINGLE_COMMIT = `git diff-tree --no-commit-id --name-only -r ${commit}`;
  const COMMIT_RANGE = `git diff --name-only ${commitRange}`;

  let command = SINGLE_COMMIT;

  if (commitRange) {
    command = COMMIT_RANGE;
  }

  const output = sh.exec(command, {async: false, silent: true}).stdout;

  const files = output.split('\n').filter(Boolean);

  return files.every((file) => file.startsWith('docs') || path.extname(file) === '.md');
};

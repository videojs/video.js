const core = require('@actions/core');
const github = require('@actions/github');

(async function run() {
  const title = github.context.payload.pull_request?.title;
  const titleRegex = /^(chore|ci|docs|feat|fix|refactor|revert|test)(\(.+\))?!?: (.+)/;

  if (!!title.match(titleRegex)) {
    core.info('Pull request title is OK');
  } else {
    core.setFailed('Please use conventional commit style for the PR title so the merged change appears in the changelog. See https://www.conventionalcommits.org/.');
  }
})();

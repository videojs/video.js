# Collaborator Guide

## Table of Contents

* [Issues and Pull Requests](#issues-and-pull-requests)
* [Accepting changes](#accepting-changes)
  * [Involving the TSC](#involving-the-tsc)
* [Landing a PR](#landing-a-pr)
  * [Landing a PR manually](#landing-a-pr-manually)
    * [Landing a PR manually with several changes](#landing-a-pr-manually-with-several-changes)
    * [I just made a mistake](#i-just-made-a-mistake)
      * [I accidentally pushed a broken commit or incorrect commit to master](#i-accidentally-pushed-a-broken-commit-or-incorrect-commit-to-master)
      * [I lost changes](#i-lost-changes)
      * [I accidentally committed a broken change to master](#i-accidentally-committed-a-broken-change-to-master)
* [video.js releases](#videojs-releases)
  * [Getting dependencies](#getting-dependencies)
    * [Install contrib](#install-contrib)
    * [npm access](#npm-access)
    * [GitHub personal access token](#github-personal-access-token)
  * [Doing a release](#doing-a-release)
* [Doc credit](#doc-credit)

## Issues and Pull Requests

Full courtesy should always be shown in video.js projects.

Collaborators may manage issues they feel qualified to handle, being mindful of our guidelines.

Any issue and PR can be closed if they are not relevant, when in doubt leave it open for more discussion. Issues can always be re-opened if new information is made available.

If issues or PRs are very short and don't contain much information, ask for more by linking to the [issue][issue template] or [PR][pr template] template. There is also a [response guide](https://github.com/videojs/video.js/wiki/New-Issue-Response-Guide) if you're unsure.

## Accepting changes

Any code change in video.js should be happening through Pull Requests on GitHub. This includes core committers.

Before a PR is merged, it must be reviewed by at least two core committers, at least one if it comes from a core committer.

Feel free to @-mention a particular core committer if you know they are experts in the area that is being changed.

If you are unsure about the modification and cannot take responsibility for it, defer to another core committer.

Before merging the change, it should be left open for other core committers to comment on. At least 24 hours during a weekday, and the 48 hours on a weekend. Trivial changes or bug fixes that have been reviewed by multiple committers may be merged without delay.

For non-breaking changes, if there is no disagreeming between the collaborators, the PR may be landed assuming it was reviewed. If there is still disagreement, it may need to be [escalated to the TSC](#involving-the-tsc).

Bug fixes require a test case that fails beforehand and succeeds after. All code changes should contain tests and pass on the CI.

### Involving the TSC

A change or issue can be elevated to the TSC by assing the `tsc-agent` label. This should be done in the following scenarios:

* There will be a major impact on the codebase or project
* The change is inherently controversial
* No agreement was reached between collaborators participating in the discussion

The TSC will be the final arbiter when required.

## Landing a PR

Landing a PR is fairly easy given that we can use the GitHub UI for it.

When using the big green button on GitHub, make sure the "squash and merge" is selected -- it should be the only allowed option. If a PR has two features in it and should be merged as two separate commits, either ask the contributor to break it up into two, or follow the [manual steps](#landing-a-pr-manually).

The commit message should follow our [conventional changelog conventions][conventions]. They are based on the angularjs changelog conventions. The changelog is then generated from these commit messages on release.

The first line of the commit message -- the header and first text box on GitHub -- should be prefixed with a type and optional scope followed by a short description of the commit.
The type is required. Two common ones are `fix` and `feat` for bug fixes and new features. Scope is optional and can be anything.

The body should contain extra information, potentially copied from the original comment of the PR.

The footer should contain things like whether this is a breaking change or what issues were fixed by this PR.

Here's an example:

```commit
fix(html5): a regression with html5 tech

This is where you'd explain what the regression is.

Fixes #123
```

### Landing a PR manually

_Optional:_ ensure you're not in a weird rebase or merge state:

```sh
git am --abort
git rebase --abort
```

Checkout and update the master branch:

```sh
git checkout master
git remote update
git rebase upstream/master
```

Check out the PR:

```sh
git fetch upstream pull/{{PR Number}}/head:{{name of branch}}
git checkout -t {{name of branch}}
```

> For example:
>
> ```sh
> git fetch upstream pull/123/head:gkatsev-html5-fix
> git checkout -t gkatsev-html5-fix
> ```

_Optional:_ If necessary, rebase against master. If you have multiple features in the PR, [landing a PR manually with several changes](#landing-a-pr-manually-with-several-changes)

```sh
git rebase master
```

Fix up any issues that arise from the rebase, change back to the master branch and squash merge:

```sh
git checkout master
git merge --squash --no-commit gkatsev-html5-fix
```

The `--no-commit` tells git not to make a commit on your behalf. It does stage everything for you, so, you can instead it:

```sh
git diff --cached
```

Now get the author from the original commit:

```sh
git log -n 1 --pretty=short gkatsev-html5-fix
```

Which shows:

```txt
  commit 433c58224f5be34480c8e067ca6c5406ba1c1e9c
  Author: Gary Katsevman <git@gkatsev.com>

      Update TOC
```

Now you can commit the change the change with the author, following our commit guidelines

```sh
git commit --author "Gary Katsevman <git@gkatsev.com>"
```

Now that it's committed, push to master

```sh
git push upstream master
```

Congratulate yourself for a job well done and the contributor for having his change landed in master.

#### Landing a PR manually with several changes

Follow the same steps as before but when you rebase against master, you want to do an interactive rebase and then squash the changes into just a few commits.

```sh
git rebase -i master
```

This will give you an output like the following:

```txt
pick b4dc15d Update CONTRIBUTING.md with latest info
pick 8592149 Add Dev certificate of origin
pick 259dee6 Add grunt and doctoc npm scripts
pick f12af12 Add conventional-changelog-videojs link
pick ae4613a Update node's CONTRIBUTING.md url
pick 433c582 Update TOC

# Rebase f599ef4..433c582 onto f599ef4 (6 command(s))
#
# Commands:
# p, pick = use commit
# r, reword = use commit, but edit the commit message
# e, edit = use commit, but stop for amending
# s, squash = use commit, but meld into previous commit
# f, fixup = like "squash", but discard this commit's log message
# x, exec = run command (the rest of the line) using shell
# d, drop = remove commit
#
# These lines can be re-ordered; they are executed from top to bottom.
#
# If you remove a line here THAT COMMIT WILL BE LOST.
#
# However, if you remove everything, the rebase will be aborted.
#
# Note that empty commits are commented out
```

Replace `pick` to `fixup` or `edit` depending on how you want the output to look. You can also re-order the commits, if necessary.

> `fixup` will squash the commit it's infront of up into the commit above it
>
> `edit` will allow you to edit the commit message before continuing

```txt
edit b4dc15d Update CONTRIBUTING.md with latest info
fixup 8592149 Add Dev certificate of origin
fixup f12af12 Add conventional-changelog-videojs link
fixup ae4613a Update node's CONTRIBUTING.md url
fixup 433c582 Update TOC
edit 259dee6 Add grunt and doctoc npm scripts
```

When you get to the edit commits, git will give more information, but you'd want to run ammend the current commit while following our commit guidelines

```sh
git commit --amend
```

After going through and making the commits you want, you want to change back to master and then rebase the branch onto master so we get a clean history

```sh
git rebase gkatsev-html5-fix
```

This will put our two commits into master:

```txt
b4dc15d chore(contributing.md): Update CONTRIBUTING.md with latest info <Gary Katsevman>
259dee6 chore(package.json): Add grunt and doctoc npm scripts <Gary Katsevman>
9e20386 v5.12.6 <Gary Katsevman>
```

Now you're ready to push to master as in the normal instructions.

#### I just made a mistake

While `git` allows you to update the remote branch with a force push (`git push -f`). This is generally frowned upon since you're rewriting public history. However, if you just pushed the change and it's been less than 10 minutes since you've done with, you may force push to update the commit, assuming no one else has already pushed after you.

##### I accidentally pushed a broken commit or incorrect commit to master

Assuming no more than 10 minutes have passed, you may force-push to update or remove the commit. If someone else has already pushed to master or 10 minutes have passed, you should instead use the revert command (`git revert`) to revert the commit and then commit the proper change, or just fix it forward with a followup commit that fixes things.

##### I lost changes

Assuming that the changes were committed, even if you lost the commit in your current history does not mean that it is lost. In a lot of cases you can still recover it from the PR branch or if all else fails look at [git's reflog](https://git-scm.com/docs/git-reflog).

##### I accidentally committed a broken change to master

This is a great time to discover that something is broken. Because it hasn't been pushed to GitHub yet, it's very easy to reset the change as if nothing has happened and try again.

To do so, just reset the branch against master.

```sh
git reset --hard upstream/master
```

## video.js releases

Releasing video.js is partially automated through [`conrib.json`](/contrib.json) scripts. To do a release, you need a couple of things: npm access, GitHub personal access token.

Releases in video.js are done on npm and GitHub and eventually posted on the CDN. These
are the instructions for the npm/GitHub releases.

When we do a release, we release it as a `next` tag on npm first and then at least a week later, we promote this release to `latest` on npm.

### Getting dependencies

#### Install contrib

You can install it globally

```sh
npm i -g contrib/contrib
```

#### npm access

To see who currently has access run this:

```sh
npm owner ls video.js
```

If you are a core committer, you can request access to npm from one of the current owners.

#### GitHub personal access token

This is used to make a GitHub release on videojs. You can get a token from the [personal access tokens](https://github.com/settings/tokens) page.

After generating one, make sure to keep it safe because GitHub will not show the token for you again. A good place to save it is Lastpass Secure Notes.

### Doing a release

To do a release, check out the master branch

```sh
git checkout master
```

Then run the contrib command to do the next release. Don't forget to provide your GitHub token so the GitHub release goes through.

```sh
VJS_GITHUB_USER=gkatsev VJS_GITHUB_TOKEN=my-personal-access-token contrib release next patch
```

This makes a patch release, you can also do a `minor` and a `major` release.

After it's done, verify that the GitHub release has the correct changelog output.

## Doc credit

This collaborator guide was heavily inspired by [node.js's guide](https://github.com/nodejs/node/blob/master/COLLABORATOR_GUIDE.md)

[issue template]: /.github/ISSUE_TEMPLATE.md

[pr template]: /.github/PULL_REQUEST_TEMPLATE.md

[conventions]: https://github.com/videojs/conventional-changelog-videojs/blob/master/convention.md

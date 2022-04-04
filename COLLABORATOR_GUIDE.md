# Collaborator Guide

## Table of Contents

* [Issues and Pull Requests](#issues-and-pull-requests)
  * [Labels](#labels)
* [Accepting changes](#accepting-changes)
  * [Involving the TSC](#involving-the-tsc)
* [Landing a PR](#landing-a-pr)
  * [Landing a PR manually](#landing-a-pr-manually)
    * [Landing a PR manually with several changes](#landing-a-pr-manually-with-several-changes)
    * [I just made a mistake](#i-just-made-a-mistake)
      * [I accidentally pushed a broken commit or incorrect commit to main](#i-accidentally-pushed-a-broken-commit-or-incorrect-commit-to-main)
      * [I lost changes](#i-lost-changes)
      * [I accidentally committed a broken change to main](#i-accidentally-committed-a-broken-change-to-main)
* [video.js releases](#videojs-releases)
  * [Getting dependencies](#getting-dependencies)
    * [npm access](#npm-access)
    * [GitHub personal access token](#github-personal-access-token)
  * [Deciding what type of version release](#deciding-what-type-of-version-release)
  * [Doing a release](#doing-a-release)
    * [Current Video.js](#current-videojs)
    * [Legacy Video.js (5)](#legacy-videojs-5)
      * [Edit git-semver-tags](#edit-git-semver-tags)
    * [And now for the release](#and-now-for-the-release)
  * [Deploy as a patch to the CDN](#deploy-as-a-patch-to-the-cdn)
  * [Announcement](#announcement)
* [Doc credit](#doc-credit)

## Issues and Pull Requests

Full courtesy should always be shown in video.js projects.

Collaborators may manage issues they feel qualified to handle, being mindful of our guidelines.

Any issue and PR can be closed if they are not relevant, when in doubt leave it open for more discussion. Issues can always be re-opened if new information is made available.

If issues or PRs are very short and don't contain much information, ask for more by linking to the [issue][issue template] or [PR][pr template] template. There is also a [response guide](https://github.com/videojs/video.js/wiki/New-Issue-Response-Guide) if you're unsure.

### Labels

There are labels that are useful to include on issues and PRs. A few of them are defined below:

| Label                    | Issue or PR  | Description                                                                |
| ------------------------ | ------------ | -------------------------------------------------------------------------- |
| confirmed                | Issue and PR | Issue: marks as reproducible. PR: marks as ready to be merged              |
| 5.x                      | PR           | Marks as a change to the 5.x branch only                                   |
| bug                      | Issue        | Marks as a confirmed bug                                                   |
| good first issue         | Issue        | Marks as a good bug or enhancement for first time contributors to Video.js |
| first-timers-only        | Issue        | Marks as a good bug or enhancement to be done by a newcomer to open source |
| minor, patch, major      | PR           | Marks PR with the expected semver classification of the change             |
| needs: LGTM              | PR           | Marks PR to be reviewed by a collaborator                                  |
| needs: more info         | Issue        | Marks as needing more information from the issue reporter                  |
| needs: reduced test case | Issue        | Marks as needing a reduced test case from the issue reporter               |

## Accepting changes

Any code change in video.js should be happening through Pull Requests on GitHub. This includes core committers.

Before a PR is merged, it must be reviewed by at least two core committers, at least one if it comes from a core committer.

Feel free to @-mention a particular core committer if you know they are experts in the area that is being changed.

If you are unsure about the modification and cannot take responsibility for it, defer to another core committer.

Before merging the change, it should be left open for other core committers to comment on. At least 24 hours during a weekday, and the 48 hours on a weekend. Trivial changes or bug fixes that have been reviewed by multiple committers may be merged without delay.

For non-breaking changes, if there is no disagreement between the collaborators, the PR may be landed assuming it was reviewed. If there is still disagreement, it may need to be [escalated to the TSC](#involving-the-tsc).

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

The first line of the commit message -- the header, which is the first text box on GitHub -- should be prefixed with a type and optional scope followed by a short description of the commit.
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

Checkout and update the main branch:

```sh
git checkout main
git remote update
git rebase upstream/main
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

_Optional:_ If necessary, rebase against main. If you have multiple features in the PR, [landing a PR manually with several changes](#landing-a-pr-manually-with-several-changes)

```sh
git rebase main
```

Fix up any issues that arise from the rebase, change back to the main branch and squash merge:

```sh
git checkout main
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

Now that it's committed, push to main

```sh
git push upstream main
```

Congratulate yourself for a job well done and the contributor for having his change landed in main.

#### Landing a PR manually with several changes

Follow the same steps as before but when you rebase against main, you want to do an interactive rebase and then squash the changes into just a few commits.

```sh
git rebase -i main
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

After going through and making the commits you want, you want to change back to main and then rebase the branch onto main so we get a clean history

```sh
git rebase gkatsev-html5-fix
```

This will put our two commits into main:

```txt
b4dc15d chore(contributing.md): Update CONTRIBUTING.md with latest info <Gary Katsevman>
259dee6 chore(package.json): Add grunt and doctoc npm scripts <Gary Katsevman>
9e20386 v5.12.6 <Gary Katsevman>
```

Now you're ready to push to main as in the normal instructions.

#### I just made a mistake

While `git` allows you to update the remote branch with a force push (`git push -f`). This is generally frowned upon since you're rewriting public history. However, if you just pushed the change and it's been less than 10 minutes since you've done with, you may force push to update the commit, assuming no one else has already pushed after you.

##### I accidentally pushed a broken commit or incorrect commit to main

Assuming no more than 10 minutes have passed, you may force-push to update or remove the commit. If someone else has already pushed to main or 10 minutes have passed, you should instead use the revert command (`git revert`) to revert the commit and then commit the proper change, or just fix it forward with a followup commit that fixes things.

##### I lost changes

Assuming that the changes were committed, even if you lost the commit in your current history does not mean that it is lost. In a lot of cases you can still recover it from the PR branch or if all else fails look at [git's reflog](https://git-scm.com/docs/git-reflog).

##### I accidentally committed a broken change to main

This is a great time to discover that something is broken. Because it hasn't been pushed to GitHub yet, it's very easy to reset the change as if nothing has happened and try again.

To do so, just reset the branch against main.

```sh
git reset --hard upstream/main
```

## video.js releases

Releasing video.js is partially automated through various scripts.
To do a release, you need a couple of things: npm access, GitHub personal access token.

Releases in video.js are done on npm and GitHub and eventually posted on the CDN.
These are the instructions for the npm/GitHub releases.

When we do a release, we release it as a `next` tag on npm first and then at least a week later, we promote this release to `latest` on npm.

### Getting dependencies

#### npm access

To see who currently has access run this:

```sh
npm owner ls video.js
```

If you are a core committer, you can request access to npm from one of the current owners.
Access is managed via an [npm organization][npm org] for [Video.js][vjs npm].

#### GitHub personal access token

This is used to make a GitHub release on videojs. You can get a token from the [personal access tokens](https://github.com/settings/tokens) page.

After generating one, make sure to keep it safe because GitHub will not show the token for you again. A good place to save it is Lastpass Secure Notes.

### Deciding what type of version release

Since we follow the [conventional changelog conventions][conventions],
all commits are prepended with a type, most commonly `feat` and `fix`.
If all the commits are fix or other types such as `test` or `chore`, then the release will be a `patch` release.
If there's even one `feat`, the release will be a `minor` release.
If any commit has a `BREAKING CHANGE` footer, then the release will be a `major` release.
Most common releases will be either `patch` or `minor`.

### Doing a release

It is also recommended you have a clean clone of Video.js for each release line you want to release.
That means having a folder for main/v6 and one for 5.x.
This is because 5.x and 6.x have different versions expecations for release process and have different dependencies.
Plus, during development you could end up with a dirty repo, so, it just usually easier if you have a clean release repo.

```sh
# for v6
git clone git@github.com:videojs/video.js.git videojs-6-release
# for v5
git clone git@github.com:videojs/video.js.git videojs-5-release
```

#### Current Video.js

Make sure go to the main branch and grab the latest updates.

```sh
git checkout main
git pull origin main
```

At this point, you should run `npm install` because dependencies may have changed.

Then, it's mostly a standard npm package release process with running `npm version`, followed by an `npm publish`.

```sh
npm version {major|minor|patch}
```

Depending on the commits that have been merged, you can choose from `major`, `minor`, or `patch` as the versioning values.
See [deciding what type of version release section](#deciding-what-type-of-version-release).

Optionally, you can run `git show` now to verify that the version update and CHANGELOG automation worked as expected.

Afterwards, you want to push the commit and the tag to the repo.
It's necessary to do this before running `npm publish` because our GitHub release automation
relies on the commit being available on GitHub.

```sh
git push --tags origin main
```

Finally, run `npm publish` with an appropriate tag. Don't forget to supply your token.

```sh
VJS_GITHUB_USER=gkatsev VJS_GITHUB_TOKEN=my-personal-access-token npm publish --tag next
```

After it's done, verify that the GitHub release has the correct changelog output.
This is to make sure that the CHANGELOG didn't get garbled and isn't missing pieces.

If the GitHub release did not work correctly, such as if the GitHub token was not provided,
you can run it manually:

```sh
VJS_GITHUB_USER=gkatsev VJS_GITHUB_TOKEN=123 node build/gh-release.js --prelease
```

#### Legacy Video.js (5)

Make sure to go to the 5.x branch and grab the latest updates.

```sh
git checkout 5.x
git pull origin 5.x
```

> _Note:_ you probably need to delete v6 tags due to the way that the our CHANGELOG lib works.
>
> You can run this to delete them:
>
> ```sh
> git tag | grep '^v6' | xargs git tag -d
> ```
>
> This will find all tags that start with `^v6` and delete them.

At this point, you should run `npm install` because dependencies may have changed.

Then, we have a script that automates most of the steps for publishing. It's a little trickier than publishing v6.

##### Edit git-semver-tags

You'll need to edit `git-semver-tags` to support our usage of tags that are not part of the branch.
In the file `node_modules/conventional-changelog-cli/node_modules/conventional-changelog/node_modules/conventional-changelog-core/node_modules/git-semver-tags/index.js`, edit the line that says sets the `cmd` to be:

```js
var cmd = 'git log --all --date-order --decorate --no-color';
```

#### And now for the release

After getting rid of the tags and getting the latest updates, you can just run the release script:

```sh
VJS_GITHUB_USER=gkatsev VJS_GITHUB_TOKEN=123 ./build/bin/release-next.sh
```

It will prompt you for a version change type, so, input `patch` or `minor` or `major`.
See [deciding what type of version release section](#deciding-what-type-of-version-release).

When it's done building everything, it'll show you the commit that's made via the default pager (i.e., less).
At this point you can verify that things look normal rather than, for example, missing all the CSS.

After exiting the pager, it'll make sure you want to continue with publishing.

It will automatically release it as a `next-5` tag on npm.

Then push the local changes up:

```sh
git push --tags origin 5.x
```

Also, you'll need to copy the CHANGELOG for this version and manually edit the GitHub release to include it.
The current release's CHANGELOG could be copied from the [raw CHANGELOG.md file][raw chg] (or locally from the markdown file)
and then pasted into the correct [GitHub release](https://github.com/videojs/video.js/releases).

### Deploy as a patch to the CDN

Follow the steps on the [CDN repo][cdn repo] for the CDN release process.
If it's a `next` or `next-5` release, only publish the patch version to the CDN.

When the version gets promoted to `latest` or `latest-5`, the corresponding `minor` or `latest` version should be published to the CDN.

### Announcement

An announcement should automatically make it's way to #announcements channel on [slack][], it uses IFTTT and might take a while.

You can also post it to twitter or ask someone (like @gkatsev) to post on your behalf.

If it's a large enough release, consider writing a blog post as well.

## Doc credit

This collaborator guide was heavily inspired by [node.js's guide](https://github.com/nodejs/node/blob/master/COLLABORATOR_GUIDE.md)

[issue template]: /.github/ISSUE_TEMPLATE.md

[pr template]: /.github/PULL_REQUEST_TEMPLATE.md

[conventions]: https://github.com/videojs/conventional-changelog-videojs/blob/main/convention.md

[vjs npm]: https://www.npmjs.com/org/videojs

[npm org]: https://docs.npmjs.com/misc/orgs

[slack]: http://slack.videojs.com

[cdn repo]: https://github.com/videojs/cdn

[raw chg]: https://raw.githubusercontent.com/videojs/video.js/5.x/CHANGELOG.md

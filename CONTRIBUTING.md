So you're telling me you want to spend some of your precious time giving back to this humble project? You're crazy. But since you're here...there are some ways you can help make Video.js a faster, easier, more compatible, and more fully-featured video player.

  * Bug reports and fixes
  * Features and changes (pull requests)
  * [Answer questions](http://stackoverflow.com/questions/tagged/video.js) on Stack Overflow
  * Other Video.js projects

Don't miss the [code style guide](#code-style).

# Getting started

1. [Download and install Node.js](http://nodejs.org/download/). Video.js uses Node for build and test automation.
   There is a known issue between Node.js version 0.10.x and phantomjs.  This will manifest itself during the node module installation (see step 4 below).  For the time being, please install Node.js version 0.8.22 or earlier.  You can find earlier versions of Node.js [here](http://nodejs.org/dist/).

2. [Fork](http://help.github.com/fork-a-repo/) and clone the video.js git repository.

  ```bash
  # Clones your fork of the repo into the current directory in terminal
  git clone https://github.com/<your-username>/video-js.git
  # Navigate to the newly cloned directory
  cd video-js
  # Assigns the original repo to a remote called "upstream"
  git remote add upstream https://github.com/zencoder/video-js.git
  ```

  In the future, if you want to pull in updates to video.js that happened after you cloned the main repo, you can run:

  ```bash
  git checkout master
  git pull upstream master
  ```

3. Install the grunt-cli package so that you will have the correct version of grunt available from any project that needs it. This should be done as a global install:

  ```bash
  npm install -g grunt-cli
  ```

4. Install required node.js modules using node package manager.

  ```bash
  npm install
  ```

5. Build a local copy. Video.js uses [grunt](http://gruntjs.com), a node-based task automation tool for building and tesing. The following will compile a local copy in the dist/ directory and run tests. It will also create a sourcelist.js file that can be used to load the video.js source scripts in a page.

  ```bash
  grunt
  ```

6. When you're ready to add a feature, make a change, or fix a bug, first create a new branch for it. Prefix the branch with the correspoding [issue number](https://github.com/zencoder/video-js/issues). If there isn't one, submit a new issue. Anything more complicated than simple docs changes should have an issue.

  ```bash
  git checkout -b <####-branch-name>
  ```

Be sure to reference your issue in any commit message. Github allows you to do this though the [fixes or closes](https://github.com/blog/831-issues-2-0-the-next-generation) keywords.

  ```bash
  My commit message. fixes #123
  ```

# Bugs

A bug is a _demonstrable problem_ that is caused by the code in the
repository. Good bug reports are extremely helpful - thank you!

Guidelines for bug reports:

1. **Use the [GitHub issue search](https://github.com/zencoder/video-js/issues)** &mdash; check if the issue has already been reported.

2. **Check if the issue has been fixed** &mdash; try to reproduce it using the latest `master` branch in the repository.

3. **Isolate the problem** &mdash; ideally create a [reduced test
   case](http://css-tricks.com/6263-reduced-test-cases/) and a live example.

A good bug report shouldn't leave others needing to chase you up for more information. Please try to be as detailed as possible in your report. What is your environment? What steps will reproduce the issue? What browser(s), OS, and devices experience the problem? What would you expect to be the outcome? All these
details will help people to fix any potential bugs.

Example:

> Short and descriptive example bug report title
>
> A summary of the issue and the browser/OS environment in which it occurs. If
> suitable, include the steps required to reproduce the bug.
>
> 1. This is the first step
> 2. This is the second step
> 3. Further steps, etc.
>
> `<url>` (a link to the reduced test case)
>
> Any other information you want to share that is relevant to the issue being
> reported. This might include the lines of code that you have identified as
> causing the bug, and potential solutions (and your opinions on their
> merits).

**[File a bug report](https://github.com/h5bp/html5-boilerplate/issues/)**

### NOTE: Testing Flash Locally in Chrome
Chrome 21+ (as of 2013/01/01) doens't run Flash files that are local and loaded into a locally accessed page (file:///). To get around this you need to [disable the version of Flash](http://helpx.adobe.com/flash-player/kb/flash-player-google-chrome.html#How_can_I_run_debugger_or_alternate_versions_of_Flash_Player_in_Google_Chrome) included with Chrome and enable a system-wide version of Flash.


## Pull requests

Good pull requests - patches, improvements, new features - are a fantastic help. They should remain focused in scope and avoid containing unrelated commits. If your contribution involves a significant amount of work or substantial changes to any part of the project, please open an issue to discuss it first.

Make sure to adhere to the coding conventions used throughout a project (indentation, accurate comments, etc.). Please update any documentation that is relevant to the change you're making.

Please follow this process; it's the best way to get your work included in the project:

1. [Fork](http://help.github.com/fork-a-repo/) the project, clone your fork, and configure the remotes:

   ```bash
   # Clones your fork of the repo into the current directory in terminal
   git clone https://github.com/<your-username>/html5-boilerplate.git
   # Navigate to the newly cloned directory
   cd html5-boilerplate
   # Assigns the original repo to a remote called "upstream"
   git remote add upstream https://github.com/h5bp/html5-boilerplate.git
   ```

2. If you cloned a while ago, get the latest changes from upstream:

   ```bash
   git checkout master
   git pull upstream master
   ```

3. Create a new topic branch to contain your feature, change, or fix:

   ```bash
   git checkout -b <topic-branch-name>
   ```

4. Commit your changes in logical chunks. Please adhere to these [git commit message guidelines](http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html) or your pull request is unlikely be merged into the main project. Use git's [interactive rebase](https://help.github.com/articles/interactive-rebase) feature to tidy up your commits before making them public.

5. Locally merge (or rebase) the upstream development branch into your topic branch:

   ```bash
   git pull [--rebase] upstream master
   ```

6. Push your topic branch up to your fork:

   ```bash
   git push origin <topic-branch-name>
   ```

10. [Open a Pull Request](http://help.github.com/send-pull-requests/) with a clear title and description.

# Code Style
Please follow [Google's JavaScript Style Guide](http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml) to the letter. If your editor supports [.editorconfig](http://editorconfig.org/#download) it will make it easier to manage differences from your own coding style.

### Style examples include:
* Two space indents.
* Delimit strings with single-quotes `'`, not double-quotes `"`.
* No trailing whitespace, except in markdown files where a linebreak must be forced.
* No more than [one assignment](http://benalman.com/news/2012/05/multiple-var-statements-javascript/) per `var` statement.
* Prefer `if` and `else` to ["clever"](http://programmers.stackexchange.com/a/25281) uses of `? :` conditional or `||`, `&&` logical operators.
* **When in doubt, follow the conventions you see used in the source already.**

If you happen to find something in the codebase that does not follow the style guide, that's a good opportunity to make your first contribution!

# Other Video.js Pojects
* [Video.js SWF](https://github.com/zencoder/video-js-swf) - The light-weight flash video player that makes flash work like HTML5 video. This allows player skins, plugins, and other features to work with both HTML5 and Flash.

* [Videojs.com](http://videojs.com) - The public site with helpful tools and information about Video.js.

---
### Doc Credit
This doc was inspired by some great contribution guide examples including [contribute.md template](https://github.com/contribute-md/contribute-md-template),
[grunt](https://github.com/gruntjs/grunt/wiki/Contributing),
[html5 boilerplate](https://github.com/h5bp/html5-boilerplate/blob/master/CONTRIBUTING.md),
[jquery](https://github.com/jquery/jquery/blob/master/CONTRIBUTING.md),
and [node.js](https://github.com/joyent/node/wiki/Contributing).

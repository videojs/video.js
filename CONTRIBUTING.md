If you're on this page, you must be interested in spending some time giving back to this humble project. If that's the case, fantastic! Here are some ways you can help make Video.js a faster, easier, more compatible, and more fully-featured video player.

  * Bug reports and fixes
  * Features and changes
  * [Answer questions](http://stackoverflow.com/questions/tagged/video.js) on Stack Overflow
  * Other Video.js projects

Thanks again for helping out! One thing we ask is that you refer to the [code style guide](#code-style) when writing your code.

# Getting started

1. [Download and install Node.js](http://nodejs.org/download/). Video.js uses Node for build and test automation. Node is available for Windows, Mac OS X, Linux, and SunOS, as well as source code, in case you want to build it yourself.

2. Fork the video.js git repository. At the top of every github page, there is a Fork button. Click it, and the forking process will copy Video.js into your organization. You can find more information on [Forking a Github repository](http://help.github.com/fork-a-repo/) here.

3. Clone your copy of video.js to your local workstation.

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

4. Install the grunt-cli package so that you will have the correct version of grunt available from any project that needs it. This should be done as a global install:

  On Unix-based systems, you'll have to do this as a superuser:
  ```bash
  sudo npm install -g grunt-cli
  ```
  On Windows, you can just run:
  ```bash
  npm install -g grunt-cli
  ```

5. Install required node.js modules using node package manager.

  You do not need to install these modules as a superuser, so for all platforms run:
  ```bash
  npm install
  ```

  A note to Windows developers: If you run npm commands, and you find that your command prompt colors have suddenly reversed, you can configure npm to set color to false to prevent this from happening.
  ```bash
  npm config set color false
  ```
  Note that this change takes effect when a new command prompt window is opened; the current window will not be affected.
6. Build a local copy and run the current suite of tests. Video.js uses [grunt](http://gruntjs.com), a node-based task automation tool for building and tesing. 

  The following will compile a local copy in the dist/ directory and run tests. It will also create a sourcelist.js file that can be used to load the video.js source scripts in a page.

  ```bash
  grunt
  ```
  To run the QUnit test suite, run:
  ```bash
  grunt test
  ```

7. Depending on whether you're adding something new, making a change or fix a bug, you'll want to do some up-front preparation.
   1. If you're fixing a bug, submit an issue for it. If you're fixing an existing bug, claim it by adding a comment to it. This will give a heads-up to anyone watching the issue that you're working on a fix. Please refer to the [Bugs](#bugs) section below for guidelines on filing new issues.
   2. Create a new branch for your work.

   If you're adding new functionality instead, you only need to create a new branch for your work. When you submit a Pull Request, Github automatically opens a new issue to track it.

  Since the issue filing process is described elsewhere, let's assume that you've filed or claimed the issue already.

  Next, create the branch.  We've created a grunt plugin that helps you do this.
  For new features:
  ```bash
  grunt feature:start
  ```

  If you're fixing an issue:
  ```bash
  grunt issue:start
  ```

  You will be prompted to name the branch.  After that, grunt will create the branch locally, push it up to your origin, and track it.  You're now ready to start building your feature or fixing that bug!

8. Thoroughly test your feature or fix. If you're fixing a bug, we recommend in addition to testing the fix itself, to do some testing around the areas that your fix has touched. For example, a brief smoketest of the player never hurts.

9. Commit your feature or fix locally.

  Be sure to reference your issue in any commit message. Github allows you to do this though the [fixes](https://github.com/blog/831-issues-2-0-the-next-generation) keyword.

  ```bash
  My commit message. fixes issue#123
  Testing:
  (briefly describe any testing here, for example, 'unit tests and cross-browser manual tests around playback and network interruption')
  ```
10. You can use grunt to submit your [Pull Request](#pull-requests).

  For your new feature:
  ```bash
  grunt feature:submit
  ```
  Or for your bug fix:
  ```bash
  grunt issue:submit
  ```

  You'll be prompted for title and description for the Pull Request.  After that, your Pull Request will be submitted to video-js.

11. You're Done! (except for cleanup).  And grunt can help with that too!

  To clean up your feature:
  ```bash
  grunt feature:delete
  ```

  Or your bug fix:
  ```bash
  grunt issue:delete
  ```
  PLEASE NOTE: THIS WILL DELETE YOUR LOCAL AND REMOTE COPIES OF THE FEATURE.
  This is meant to clean up your local and remote branches, so make sure any changes you don't want to lose have been pulled into the parent project or another branch first.
  
# Bugs

**A bug is a demonstrable problem** that is caused by the code in the repository. Good bug reports are extremely helpful. Thank You!

Guidelines for bug reports:

1. Use the [GitHub issue search](https://github.com/zencoder/video-js/issues) &mdash; check if the issue has already been reported.

2. Check if the issue has been fixed &mdash; try to reproduce it using the latest `master` branch in the repository.

3. Isolate the problem &mdash; ideally create a [reduced test case](http://css-tricks.com/6263-reduced-test-cases/) and a live example.

A good bug report should be as detailed as possible, so that others won't have to follow up for the essential details.

Here's an example:

> Short yet concise Bug Summary
>
> Description
> Happens on Windows 7 and OSX. Seen with IE9, Firefox 19 OSX, Chrome 21, Flash 11.6 and 11.2
>
> 1. This is the first step
> 2. This is the second step
> 3. Further steps, etc.
>
> Expected:
> (describe the expected outcome of the steps above)
>
> Actual:
> (describe what actually happens)
>
> `<url>` (a link to the reduced test case, if it exists)
>
> Any other information you want to share that is relevant to the issue being
> reported. This might include the lines of code that you have identified as
> causing the bug, and potential solutions (and your opinions on their
> merits).

**[File a bug report](https://github.com/zencoder/video-js/issues/new)**

### NOTE: Testing Flash Locally in Chrome
Chrome 21+ (as of 2013/01/01) doens't run Flash files that are local and loaded into a locally accessed page (file:///).
To get around this you can do either of the following:

1. Do your development and testing using a local HTTP server.

2. [Disable the version of Flash included with Chrome](http://helpx.adobe.com/flash-player/kb/flash-player-google-chrome.html#How_can_I_run_debugger_or_alternate_versions_of_Flash_Player_in_Google_Chrome) and enable a system-wide version of Flash instead.

## Pull requests

Good pull requests - bug fixes, improvements, new features - are a fantastic help. They should remain focused in scope and avoid containing unrelated commits. If your contribution involves a significant amount of work or substantial changes to any part of the project, please open an issue to discuss it first.

Make sure to adhere to the coding conventions used throughout a project (indentation, accurate comments, etc.). Please update any documentation that is relevant to the change you're making.

Please follow this process; it's the best way to get your work included in the project:

1. Commit your changes in logical chunks. Please adhere to these [git commit message guidelines](http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html) or your pull request is unlikely be merged into the main project. Use git's [interactive rebase](https://help.github.com/articles/interactive-rebase) feature to tidy up your commits before making them public.

2. Locally merge (or rebase) the upstream development branch into your topic branch:

   ```bash
   git pull [--rebase] upstream master
   ```

3. Push your topic branch up to your fork:

   ```bash
   git push origin <topic-branch-name>
   ```

4. [Open a Pull Request](http://help.github.com/send-pull-requests/) with a clear title and description.

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

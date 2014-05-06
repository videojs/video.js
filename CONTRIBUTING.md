CONTRIBUTING
============
So you want to help out? Great! There's a number of ways you can get involved.

  * [File and discuss issues](#filing-issues)
  * [Contribute code](#contributing-code)
  * [Build and share plugins](docs/plugins.md)
  * [Answer questions on Stack Overflow](http://stackoverflow.com/questions/tagged/video.js)

There's also other Video.js projects where you can help. (check the [video.js org](https://github.com/videojs) for an up-to-date list of projects)

  * [Videojs.com](https://github.com/videojs/videojs.com)
  * [Video.js flash player](https://github.com/videojs/video-js-swf)
  * [Player skin designer](https://github.com/videojs/designer)
  * [Contribflow](https://github.com/zencoder/contribflow)

Filing issues
-------------
[GitHub Issues](https://github.com/videojs/video.js/issues) are used for all discussions around the codebase, including **bugs**, **features**, and other **enhancements**.

### Reporting a Bug

**A bug is a demonstrable problem** that is caused by the code in the repository. Good bug reports are extremely helpful. Thank You!

Guidelines for bug reports:

1. Use the [GitHub issue search](https://github.com/videojs/video.js/issues) &mdash; check if the issue has already been reported.

2. Check if the issue has already been fixed &mdash; try to reproduce it using the latest `master` branch in the repository.

3. Isolate the problem &mdash; **create a [reduced test case](http://css-tricks.com/6263-reduced-test-cases/)** with a live example. You can possibly use [this JSBin example](http://jsbin.com/axedog/7/edit) as a starting point.

A good bug report should be as detailed as possible, so that others won't have to follow up for the essential details.

Here's an example:

> Short yet concise Bug Summary
>
> Description:
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

**[File a bug report](https://github.com/videojs/video.js/issues/new)**

### Requesting a Feature

1. [Check the plugin list](https://github.com/videojs/video.js/wiki/Plugins) for any plugins that may already support the feature.

2. [Search the issues](https://github.com/videojs/video.js/issues) for any previous requests for the same feature, and give a thumbs up or +1 on existing requests.

2. If no previous requests exist, create a new issue. Please be as clear as possible about why the feautre is needed and the intended use case.

**[Request a feature](https://github.com/videojs/video.js/issues/new)**

Contributing code
-----------------

To contibute code you'll need to be able to build a copy of Video.js and run tests locally. There are a few requirements before getting started.

- Node.js -- Video.js uses Node for build and test automation. Node is available for Windows, Mac OS X, Linux, and SunOS, as well as source code if that doesn't scare you. [Download and install Node.js](http://nodejs.org/download/)

- grunt-cli -- Install grunt-cli globally so that you will have the correct version of grunt available for any project that needs it.

  On Unix-based systems, you'll have to do this as a superuser:

```bash
sudo npm install -g grunt-cli
```
  On Windows, you can just run:

```bash
npm install -g grunt-cli
```

- Contribflow -- A homegrown git workflow tool for managing feature/hotfix branches and submitting pull requests. If you have your own preferred git workflow, contribflow isn't required, but the following instructions will assume you're using it.

  On Unix-based systems, you'll have to do this as a superuser:

```bash
sudo npm install -g contribflow
```

  On Windows, you can just run:

```bash
npm install -g contribflow
```

### Building your own copy of Video.js

First, [fork](http://help.github.com/fork-a-repo/) the video.js git repository. At the top of every github page, there is a Fork button. Click it, and the forking process will copy Video.js into your own GitHub account.

Clone your fork of the repo into your code directory

```bash
git clone https://github.com/<your-username>/video.js.git
```

Navigate to the newly cloned directory

```bash
cd video.js
```

Assign the original repo to a remote called "upstream"

```
git remote add upstream https://github.com/videojs/video.js.git
```

>In the future, if you want to pull in updates to video.js that happened after you cloned the main repo, you can run:
>
> ```bash
> git checkout master
> git pull upstream master
> ```

Install the required node.js modules using node package manager

```bash
npm install
```

> A note to Windows developers: If you run npm commands, and you find that your command prompt colors have suddenly reversed, you can configure npm to set color to false to prevent this from happening.
> `npm config set color false`
> Note that this change takes effect when a new command prompt window is opened; the current window will not be affected.

Build a local copy of video.js and run tests

```bash
grunt
grunt test
```

Video.js is also configured to run tests with Karma. Karma is installed as a grunt plugin to run QUnit tests in real browsers, as opposed to simply running the tests in phantomjs, a headless browser. 

To run the QUnit test suite in Karma, do the following: 
1. Copy test/karma.conf.js.example and rename the copy test/karma.conf.js.  Please note that if you decide to name the file something other than karma.conf.js, or if you decide to change the location of your conf.js file from the test/ folder, you will need to change references to karma.conf.js in Gruntfile and .gitignore to your new file name and location, so that you don't inadvertently add your conf.js file to any of your video.js pull requests.
2. Open test/karma.conf.js in an editor, and configure the properties in it as desired.  At a minimum, you'll want to add the browsers that you want to run your tests in.  The karma.conf.js.example file has detailed information on usage in the file itself. 
After you've configured the desired properties in your karma.conf.js, run:
```bash
grunt karma:dev
```

At this point you should have a built copy of video.js in a directory named `dist`, and all tests should be passing.

### Making Changes

Whether you're adding something new, making something better, or fixing a bug, you'll first want to search the [GitHub issues](https://github.com/videojs/video.js/issues) and [plugins list](https://github.com/videojs/video.js/wiki/Plugins) to make sure you're aware of any previous discussion or work. If an unclaimed issue exists, claim it via a comment. If no issue exists for your change, submit one, follwing the [issue filing guidelines](#filing-issues).

There are two categories of changes in video.js land, features and hotfixes (Video.js follows a branching model similar to [gitflow](http://nvie.com/posts/a-successful-git-branching-model/)). Hotfixes are for urgent fixes that need to be released immediately as a patch. Features are for everything else (including non-urgent fixes). If you think you have a hotfix scenario, verify that (via comment) before starting the work. We'll focus on features here, but you can swap `hotfix` for `feature` in any command.

Start a new development branch

```bash
contrib feature start
```

You'll be prompted to name the branch.  After that, contrib will create the branch locally, and use git to push it up to your origin, and track it.  You're now ready to start building your feature or fixing that bug! Be sure to read the [Code Style Guide](#code-style-guide).

While you're developing, you can ensure your changes are working by writing tests (in the `test` directory) and running `grunt test`.

There's also a sandbox directory where you can add any file and it won't get tracked as a change. To start you can copy the example index file and see a working version of a player (using the local source code) by loading it in a browser.

```bash
cp sandbox/index.html.example sandbox/index.html
open sandbox/index.html
```


### Testing Locally
A simple Connect server is available via the Grunt plugin. The commands below will allow you to setup a test sandbox and begin development.

```bash
cp sandbox/index.html.example sandbox/index.html
grunt connect
open http://localhost:9999/sandbox/index.html
```

> NOTES regarding local testing in Chrome 21+ (as of 2013/01/01)
> Flash files that are local and loaded into a locally accessed page (file:///) will NOT run.
> To get around this you can do either of the following:
>
> 1. Do your development and testing using a local HTTP server. See Grunt commands above.
>
> 2. [Disable the version of Flash included with Chrome](http://helpx.adobe.com/flash-player/kb/flash-player-google-chrome.html#How_can_I_run_debugger_or_alternate_versions_of_Flash_Player_in_Google_Chrome) and enable a system-wide version of Flash instead.

Commit and push changes as you go (using git directly). Write thorough descriptions of your changes in your commit messages.

```bash
git add .
git commit -av
git push
```

> GitHub allows you to close an issue through your commit message using the [fixes](https://github.com/blog/831-issues-2-0-the-next-generation) keyword.
>
> ```bash
> My commit message. fixes #123
> Testing: (briefly describe any testing here, for example, 'unit tests and cross-browser manual tests around playback and network interruption')
> ```

### Submitting your changes

First, thoroughly test your feature or fix, including writing tests to make sure your change doesn't get regressed in a future update. If you're fixing a bug, we recommend in addition to testing the fix itself, to do some testing around the areas that your fix has touched. For example, a brief smoketest of the player never hurts.

Make sure your changes are pushed to origin

```bash
git push
```

Use contrib to submit a a pull request (make sure you're in your feature branch)

```bash
contrib feature submit
```

You'll be prompted for title and description for the Pull Request.  After that, contrib will use Git to submit your pull request to video.js.

You're Done! (except for cleanup.) To clean up your feature or hotfix branch:

First, checkout your feature or issue branch:

```bash
git checkout (branchname)
```

Run this command to clean up your feature:

```bash
contrib feature delete
```

Run this command to clean up your bug fix:

```bash
contrib hotfix delete
```
> PLEASE NOTE: THIS WILL DELETE YOUR LOCAL AND REMOTE COPIES OF THE FEATURE.
> This is meant to clean up your local and remote branches, so make sure any changes you don't want to lose have been pulled into the parent project or another branch first.

Code Style Guide
----------------
Please follow [Google's JavaScript Style Guide](http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml) to the letter. If your editor supports [.editorconfig](http://editorconfig.org/#download) it will make it easier to manage differences from your own coding style.

### Style examples include:
* Two space indents.
* Delimit strings with single-quotes `'`, not double-quotes `"`.
* No trailing whitespace, except in markdown files where a linebreak must be forced.
* No more than [one assignment](http://benalman.com/news/2012/05/multiple-var-statements-javascript/) per `var` statement.
* Prefer `if` and `else` to ["clever"](http://programmers.stackexchange.com/a/25281) uses of `? :` conditional or `||`, `&&` logical operators.
* **When in doubt, follow the conventions you see used in the source already.**

If you happen to find something in the codebase that does not follow the style guide, that's a good opportunity to make your first contribution!

---
### Doc Credit
This doc was inspired by some great contribution guide examples including [contribute.md template](https://github.com/contribute-md/contribute-md-template),
[grunt](https://github.com/gruntjs/grunt/wiki/Contributing),
[html5 boilerplate](https://github.com/h5bp/html5-boilerplate/blob/master/CONTRIBUTING.md),
[jquery](https://github.com/jquery/jquery/blob/master/CONTRIBUTING.md),
and [node.js](https://github.com/joyent/node/wiki/Contributing).

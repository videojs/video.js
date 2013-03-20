Google Closure
==============

By default, Video.js builds a minified version of its library using a modified
version of the Google Closure compiler (see
[here](https://github.com/zencoder/video-js/tree/master/build/compiler) for
details) to minimize and optimize its code.

As is explained in Video.js's [bundled
version](https://github.com/zencoder/video-js/blob/master/src/js/goog.base.js)
of `goog.base.js`, Video.js does not actually use Google Closure, but does need
to supply a minimal version of the library, if only for the Closure Compiler.
In theory this can lead to problems for projects using both Video.js and the
official version of Google Closure if the official version of `goog/base.js`
diverges from the one bundled with Video.js.  In practice this isn't likely,
given the maturity of Google Closure and the centrality there of `goog/base.js`,
but paranoid developers may still want to be sure that they are not potentially
loading separate and conflicting versions of the Closure Library in their pages.

Developers that want to work directly with their own distribution of Google
Closure can do so in 2 ways:

1.  Run unit tests with the `goog-base` query string parameter pointing to their
own Closure Library distribution. See the [build source
loader](https://github.com/zencoder/video-js/blob/master/build/source-loader.js)
for more on that.

2.  Run `grunt` with the `--skipBundledClosure` option in order to generate the
list of files that Video.js needs, minus the bundled `goog.base.js`. You can
then have your own build scripts read the output (`build/files/sourcelist.txt`
as of this writing) and include those files in your application however you like
(minified, dynamically, etc).

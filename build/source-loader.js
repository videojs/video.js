// This file is used to load the video.js source files into a page
// in the correct order based on dependencies.
// When you create a new source file you will need to add
// it to the list below to use it in sandbox/index.html and
// test/index.html

// You can use the projectRoot variable to adjust relative urls
// that this script loads. By default it's "../", which is what /sandbox
// and /test need. If you had sandbox/newDir/index.html, in index.html you
// would set projectRoot = "../../"

// We could use somehting like requireJS to load files, and at one point
// we used goog.require/provide to load dependencies, but that seems like
// overkill with the small number of files we actually have. 
//
// It is still possible to use the official version of Google Closure instead of
// the one bundled with video-js for those who want to do that. For /sandbox or
// /test, use the 'goog-base' query parameter. For builds, pass the
// --skipBundledClosure argument to grunt.  See optPushGoogBase() below for more
// details.

// Pushes onto the given array the correct version of goog base.js to load,
// pushing nothing if no version should be loaded. 
//
// The return value from this method is consistent with a call to Array.push().
//
// --------------------------------------------------
// When this script is loaded from a browser
// --------------------------------------------------
//
// If this script is running in a browser and was loaded with a query string
// having a non-empty value for the 'goog-base' parameter, we use that value. 
//
// This means that the tests can be run directly on top of non-forked Google
// Closure distribution by passing the url to that distribution's base.js. For
// example, to run the unit tests using the latest official version in
// https://closure-library.googlecode.com/git/closure/goog/base.js, load the
// tests as follows:
//
//  .../test/index.html?goog-base=https%3A%2F%2Fclosure-library.googlecode.com%2Fgit%2Fclosure%2Fgoog%2Fbase.js
//
// Note that error handling here is minimal: it is assumed that the value, if
// present, has been properly URI encoded. Empty parameter values are not
// considered an error and are simply ignored.
//
//
// --------------------------------------------------
// When this script is loaded by Gruntfile.js
// --------------------------------------------------
//
// If the --skipBundledClosure option is passed to grunt then nothing will be
// pushed into the argument array; otherwise the default will be used. See the
// note in Gruntfile.js for more about how/why this can be effective.
//
function optPushGoogBase(arr) {

  var defl = "src/js/goog.base.js";

  if (typeof skipBundledClosure === 'undefined') { 
    if (typeof window === 'undefined') { return arr.push(defl); }
  } else if (skipBundledClosure) { return arr.length; }

  if (typeof window === 'undefined') { return arr.push(defl); } 

  var regx = /\?(?:.*&)?goog-base=([^&]+)/; // gets our 'goog-base' param val
  var mtch = regx.exec(window.location.href);

  if (mtch) { return arr.push(decodeURIComponent(mtch[1])); }

  return arr.push(defl);
}

var sourceFiles = [];
optPushGoogBase( sourceFiles );

// ADD NEW SOURCE FILES HERE
sourceFiles.push(
  "src/js/core.js",
  "src/js/events.js",
  "src/js/lib.js",
  "src/js/component.js",
  "src/js/player.js",
  "src/js/controls.js",
  "src/js/media.js",
  "src/js/media.html5.js",
  "src/js/media.flash.js",
  "src/js/tracks.js",
  "src/js/json.js",
  "src/js/setup.js",
  "src/js/plugins.js",
  "src/js/exports.js"
);

// Allow overriding the default project root
var projectRoot = projectRoot || '../';

function loadScripts(scriptsArr){
  var scriptSrc;
  for (var i = 0; i < scriptsArr.length; i++) {
    scriptSrc = scriptsArr[i];
    // Prepend scriptSrc with projectRoot if it comes from our src/ dir
    if (scriptSrc.indexOf("src/") === 0) { 
      scriptSrc = projectRoot + scriptSrc;
    }
    // Using document.write because that's the easiest way to avoid triggering
    // asynchrnous script loading
    document.write( "<script src='" + scriptSrc + "'><\/script>" );
  }
}

// We use this file in the grunt build script to load the same source file list
// and don't want to load the scripts there.
if (typeof blockSourceLoading === 'undefined') {
  loadScripts(sourceFiles);

  // Allow for making Flash first -- regex checks for 'flash' somewhere in the
  // query string but otherwise ignores any value it may have
  if (/\?(.*&)?flash([=&]|$)/.test(window.location.href)) {
    // Using doc.write to load this script to, otherwise when it runs videojs
    // is undefined
    document.write('<script>videojs.options.techOrder = ["flash"];videojs.options.flash.swf = "../src/swf/video-js.swf";</script>')
  }
}



'use strict';

exports.__esModule = true;
exports.hasLoaded = exports.autoSetupTimeout = exports.autoSetup = undefined;

var _dom = require('./utils/dom');

var Dom = _interopRequireWildcard(_dom);

var _events = require('./utils/events.js');

var Events = _interopRequireWildcard(_events);

var _document = require('global/document');

var _document2 = _interopRequireDefault(_document);

var _window = require('global/window');

var _window2 = _interopRequireDefault(_window);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

/**
 * @file setup.js - Functions for setting up a player without
 * user interaction based on the data-setup `attribute` of the video tag.
 *
 * @module setup
 */
var _windowLoaded = false;
var videojs = void 0;

/**
 * Set up any tags that have a data-setup `attribute` when the player is started.
 */
var autoSetup = function autoSetup() {

  // Protect against breakage in non-browser environments.
  if (!Dom.isReal()) {
    return;
  }

  // One day, when we stop supporting IE8, go back to this, but in the meantime...*hack hack hack*
  // var vids = Array.prototype.slice.call(document.getElementsByTagName('video'));
  // var audios = Array.prototype.slice.call(document.getElementsByTagName('audio'));
  // var mediaEls = vids.concat(audios);

  // Because IE8 doesn't support calling slice on a node list, we need to loop
  // through each list of elements to build up a new, combined list of elements.
  var vids = _document2['default'].getElementsByTagName('video');
  var audios = _document2['default'].getElementsByTagName('audio');
  var mediaEls = [];

  if (vids && vids.length > 0) {
    for (var i = 0, e = vids.length; i < e; i++) {
      mediaEls.push(vids[i]);
    }
  }

  if (audios && audios.length > 0) {
    for (var _i = 0, _e = audios.length; _i < _e; _i++) {
      mediaEls.push(audios[_i]);
    }
  }

  // Check if any media elements exist
  if (mediaEls && mediaEls.length > 0) {

    for (var _i2 = 0, _e2 = mediaEls.length; _i2 < _e2; _i2++) {
      var mediaEl = mediaEls[_i2];

      // Check if element exists, has getAttribute func.
      // IE seems to consider typeof el.getAttribute == 'object' instead of
      // 'function' like expected, at least when loading the player immediately.
      if (mediaEl && mediaEl.getAttribute) {

        // Make sure this player hasn't already been set up.
        if (mediaEl.player === undefined) {
          var options = mediaEl.getAttribute('data-setup');

          // Check if data-setup attr exists.
          // We only auto-setup if they've added the data-setup attr.
          if (options !== null) {
            // Create new video.js instance.
            videojs(mediaEl);
          }
        }

        // If getAttribute isn't defined, we need to wait for the DOM.
      } else {
        autoSetupTimeout(1);
        break;
      }
    }

    // No videos were found, so keep looping unless page is finished loading.
  } else if (!_windowLoaded) {
    autoSetupTimeout(1);
  }
};

/**
 * Wait until the page is loaded before running autoSetup. This will be called in
 * autoSetup if `hasLoaded` returns false.
 *
 * @param {number} wait
 *        How long to wait in ms
 *
 * @param {videojs} [vjs]
 *        The videojs library function
 */
function autoSetupTimeout(wait, vjs) {
  if (vjs) {
    videojs = vjs;
  }

  _window2['default'].setTimeout(autoSetup, wait);
}

if (Dom.isReal() && _document2['default'].readyState === 'complete') {
  _windowLoaded = true;
} else {
  /**
   * Listen for the load event on window, and set _windowLoaded to true.
   *
   * @listens load
   */
  Events.one(_window2['default'], 'load', function () {
    _windowLoaded = true;
  });
}

/**
 * check if the document has been loaded
 */
var hasLoaded = function hasLoaded() {
  return _windowLoaded;
};

exports.autoSetup = autoSetup;
exports.autoSetupTimeout = autoSetupTimeout;
exports.hasLoaded = hasLoaded;

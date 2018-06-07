/**
 * @file setup.js - Functions for setting up a player without
 * user interaction based on the data-setup `attribute` of the video tag.
 *
 * @module setup
 */
import * as Dom from './utils/dom';
import * as Events from './utils/events.js';
import document from 'global/document';
import window from 'global/window';

let _windowLoaded = false;
let videojs;

/**
 * Set up any tags that have a data-setup `attribute` when the player is started.
 */
const autoSetup = function() {

  // Protect against breakage in non-browser environments and check global autoSetup option.
  if (!Dom.isReal() || videojs.options.autoSetup === false) {
    return;
  }

  const vids = Array.prototype.slice.call(document.getElementsByTagName('video'));
  const audios = Array.prototype.slice.call(document.getElementsByTagName('audio'));
  const divs = Array.prototype.slice.call(document.getElementsByTagName('video-js'));
  const mediaEls = vids.concat(audios, divs);

  // Check if any media elements exist
  if (mediaEls && mediaEls.length > 0) {

    for (let i = 0, e = mediaEls.length; i < e; i++) {
      const mediaEl = mediaEls[i];

      // Check if element exists, has getAttribute func.
      if (mediaEl && mediaEl.getAttribute) {

        // Make sure this player hasn't already been set up.
        if (mediaEl.player === undefined) {
          const options = mediaEl.getAttribute('data-setup');

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
 * @param {module:videojs} [vjs]
 *        The videojs library function
 */
function autoSetupTimeout(wait, vjs) {
  if (vjs) {
    videojs = vjs;
  }

  window.setTimeout(autoSetup, wait);
}

if (Dom.isReal() && document.readyState === 'complete') {
  _windowLoaded = true;
} else {
  /**
   * Listen for the load event on window, and set _windowLoaded to true.
   *
   * @listens load
   */
  Events.one(window, 'load', function() {
    _windowLoaded = true;
  });
}

/**
 * check if the document has been loaded
 */
const hasLoaded = function() {
  return _windowLoaded;
};

export {autoSetup, autoSetupTimeout, hasLoaded};

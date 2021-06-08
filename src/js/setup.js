/**
 * @file setup.js - Functions for setting up a player without
 * user interaction based on the data-setup `attribute` of the video tag.
 *
 * @module setup
 */
import * as Dom from './utils/dom';
import document from 'global/document';
import window from 'global/window';

let _windowLoaded = false;
let videojs;

/**
 * Set up any tags that have a data-setup `attribute` when the player is started.
 */
const autoSetup = function() {

  if (videojs.options.autoSetup === false) {
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
  // Protect against breakage in non-browser environments
  if (!Dom.isReal()) {
    return;
  }

  if (vjs) {
    videojs = vjs;
  }

  window.setTimeout(autoSetup, wait);
}

/**
 * Used to set the internal tracking of window loaded state to true.
 *
 * @private
 */
function setWindowLoaded() {
  _windowLoaded = true;
  window.removeEventListener('load', setWindowLoaded);
}

if (Dom.isReal()) {
  if (document.readyState === 'complete') {
    setWindowLoaded();
  } else {
    /**
     * Listen for the load event on window, and set _windowLoaded to true.
     *
     * We use a standard event listener here to avoid incrementing the GUID
     * before any players are created.
     *
     * @listens load
     */
    window.addEventListener('load', setWindowLoaded);
  }
}

/**
 * check if the window has been loaded
 */
const hasLoaded = function() {
  return _windowLoaded;
};

export {autoSetup, autoSetupTimeout, hasLoaded};

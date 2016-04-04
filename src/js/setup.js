/**
 * @file setup.js
 *
 * Functions for automatically setting up a player
 * based on the data-setup attribute of the video tag
 */
import * as Events from './utils/events.js';
import document from 'global/document';
import window from 'global/window';

let _windowLoaded = false;
let videojs;


// Automatically set up any tags that have a data-setup attribute
var autoSetup = function(){
  // One day, when we stop supporting IE8, go back to this, but in the meantime...*hack hack hack*
  // var vids = Array.prototype.slice.call(document.getElementsByTagName('video'));
  // var audios = Array.prototype.slice.call(document.getElementsByTagName('audio'));
  // var mediaEls = vids.concat(audios);

  // Because IE8 doesn't support calling slice on a node list, we need to loop through each list of elements
  // to build up a new, combined list of elements.
  var vids = document.getElementsByTagName('video');
  var audios = document.getElementsByTagName('audio');
  var mediaEls = [];
  if (vids && vids.length > 0) {
    for(let i=0, e=vids.length; i<e; i++) {
      mediaEls.push(vids[i]);
    }
  }
  if (audios && audios.length > 0) {
    for(let i=0, e=audios.length; i<e; i++) {
      mediaEls.push(audios[i]);
    }
  }

  // Check if any media elements exist
  if (mediaEls && mediaEls.length > 0) {

    for (let i=0, e=mediaEls.length; i<e; i++) {
      let mediaEl = mediaEls[i];

      // Check if element exists, has getAttribute func.
      // IE seems to consider typeof el.getAttribute == 'object' instead of 'function' like expected, at least when loading the player immediately.
      if (mediaEl && mediaEl.getAttribute) {

        // Make sure this player hasn't already been set up.
        if (mediaEl['player'] === undefined) {
          let options = mediaEl.getAttribute('data-setup');

          // Check if data-setup attr exists.
          // We only auto-setup if they've added the data-setup attr.
          if (options !== null) {
            // Create new video.js instance.
            let player = videojs(mediaEl);
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

// Pause to let the DOM keep processing
var autoSetupTimeout = function(wait, vjs){
  if (vjs) {
    videojs = vjs;
  }

  setTimeout(autoSetup, wait);
};

if (document.readyState === 'complete') {
  _windowLoaded = true;
} else {
  Events.one(window, 'load', function(){
    _windowLoaded = true;
  });
}

var hasLoaded = function() {
  return _windowLoaded;
};

export { autoSetup, autoSetupTimeout, hasLoaded };

var autoSetup, autoSetupTimeout, hasLoaded, windowLoaded, vjsJSON, vjsevents;

vjsJSON = require('./json.js');
vjsevents = require('./events.js');

/**
 * @fileoverview Functions for automatically setting up a player
 * based on the data-setup attribute of the video tag
 */

// Automatically set up any tags that have a data-setup attribute
autoSetup = function(){
  var options, vid, player,
      vids = document.getElementsByTagName('video');

  // Check if any media elements exist
  if (vids && vids.length > 0) {

    for (var i=0,j=vids.length; i<j; i++) {
      vid = vids[i];

      // Check if element exists, has getAttribute func.
      // IE seems to consider typeof el.getAttribute == 'object' instead of 'function' like expected, at least when loading the player immediately.
      if (vid && vid.getAttribute) {

        // Make sure this player hasn't already been set up.
        if (vid['player'] === undefined) {
          options = vid.getAttribute('data-setup');

          // Check if data-setup attr exists.
          // We only auto-setup if they've added the data-setup attr.
          if (options !== null) {

            // Parse options JSON
            // If empty string, make it a parsable json object.
            options = vjsJSON.parse(options || '{}');

            // Create new video.js instance.
            player = videojs(vid, options);
          }
        }

      // If getAttribute isn't defined, we need to wait for the DOM.
      } else {
        autoSetupTimeout(1);
        break;
      }
    }

  // No videos were found, so keep looping unless page is finisehd loading.
  } else if (!windowLoaded) {
    autoSetupTimeout(1);
  }
};

// Pause to let the DOM keep processing
autoSetupTimeout = function(wait){
  setTimeout(autoSetup, wait);
};

// return whether window has loaded
hasLoaded = function() {
  return windowLoaded;
}

if (document.readyState === 'complete') {
  windowLoaded = true;
} else {
  vjsevents.one(window, 'load', function(){
    windowLoaded = true;
  });
}

module.exports = {
  autoSetup: autoSetup,
  autoSetupTimeout: autoSetupTimeout,
  hasLoaded: hasLoaded
};

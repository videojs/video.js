// HTML5 Shiv. Must be in <head> to support older browsers.
document.createElement("video");document.createElement("audio");

var VideoJS = function(id, addOptions, ready){
  var tag; // Element of ID

  // Allow for element or ID to be passed in
  // String ID
  if (typeof id == "string") {

    // Adjust for jQuery ID syntax
    if (id.indexOf("#") === 0) {
      id = id.slice(1);
    }

    // If a player instance has already been created for this ID return it.
    if (_V_.players[id]) {
      return _V_.players[id];

    // Otherwise get element for ID
    } else {
      tag = _V_.el(id)
    }

  // ID is a media element
  } else {
    tag = id;
  }

  // Check for a useable element
  if (!tag || !tag.nodeName) { // re: nodeName, could be a box div also
    throw new TypeError("The element or ID supplied is not valid. (VideoJS)"); // Returns
  }

  // Element may have a player attr referring to an already created player instance.
  // If not, set up a new player and return the instance.
  return tag.player || new _V_.Player(tag, addOptions, ready);
},

// Shortcut
_V_ = VideoJS;

VideoJS.players = {};

VideoJS.options = {

  // Default order of fallback technology
  techOrder: ["html5","flash"],
  // techOrder: ["flash","html5"],

  html5: {},
  flash: {
    swf: "http://vjs.zencdn.net/c/video-js.swf"
    // swf: "https://s3.amazonaws.com/video-js/3.0b/video-js.swf"
    // swf: "http://video-js.zencoder.com/3.0b/video-js.swf"
    // swf: "http://video-js.com/test/video-js.swf"
    // swf: "http://video-js.com/source/flash/video-js.swf"
    // swf: "http://video-js.com/source/flash/video-js.swf"
    // swf: "video-js.swf"
  },

  // Default of web browser is 300x150. Should rely on source width/height.
  width: "auto",
  height: "auto",
  
  // defaultVolume: 0.85,
  defaultVolume: 0.00, // The freakin seaguls are driving me crazy!

  // Included control sets
  components: [
    // "poster",
    "loadingSpinner",
    "bigPlayButton",
    { name: "controlBar", options: {
      components: [
        "playToggle",
        "fullscreenToggle",
        "currentTimeDisplay",
        "timeDivider",
        "durationDisplay",
        "remainingTimeDisplay",
        { name: "progressControl", options: {
          components: [
            { name: "seekBar", options: {
              components: [
                "loadProgressBar",
                "playProgressBar",
                "seekHandle"
              ]}
            }
          ]}
        },
        { name: "volumeControl", options: {
          components: [
            { name: "volumeBar", options: {
              components: [
                "volumeLevel",
                "volumeHandle"
              ]}
            }
          ]}
        },
        "muteToggle"
      ]
    }},
    "subtitlesDisplay"/*, "replay"*/
  ]
};

// Automatically set up any tags that have a data-setup attribute
_V_.autoSetup = function(){
  var options, vid, player,
      vids = document.getElementsByTagName("video");

  // Check if any media elements exist
  if (vids && vids.length > 0) {

    for (var i=0,j=vids.length; i<j; i++) {
      vid = vids[i];

      // Check if element exists, has getAttribute func.
      // IE seems to consider typeof el.getAttribute == "object" instead of "function" like expected, at least when loading the player immediately.
      if (vid && vid.getAttribute) {

        // Make sure this player hasn't already been set up.
        if (vid.player === undefined) {
          options = vid.getAttribute("data-setup");

          // Check if data-setup attr exists. 
          // We only auto-setup if they've added the data-setup attr.
          if (options !== null) {

            // Parse options JSON
            // If empty string, make it a parsable json object.
            options = JSON.parse(options || "{}");

            // Create new video.js instance.
            player = _V_(vid, options);
          }
        }

      // If getAttribute isn't defined, we need to wait for the DOM.
      } else {
        _V_.autoSetupTimeout(1);
        break;
      }
    }

  // No videos were found, so keep looping unless page is finisehd loading.
  } else if (!_V_.windowLoaded) {
    _V_.autoSetupTimeout(1);
  }
};

// Pause to let the DOM keep processing
_V_.autoSetupTimeout = function(wait){
  setTimeout(_V_.autoSetup, wait);
};

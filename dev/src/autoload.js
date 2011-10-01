_V_.loadPlayers = function(){
  var vids = document.getElementsByTagName("video"),
      options, vid;
  if (vids && vids.length > 0) {
    for (var i=0,j=vids.length; i<j; i++) {
      vid = vids[i];
      // Check if element exists, has getAttribute func.
      // IE seems to consider typeof el.getAttribute == "object" instead of "function" like expected, at least when loading the player immediately.
      if (vid && vid.getAttribute) {
        // Check if this video has already been set up by video.js.
        if (vid.player === undefined) {
          options = vid.getAttribute("data-setup");
          // Check if data-setup attr exists. 
          // We only auto-setup if they've added the data-setup attr.
          if (options !== null) {
            // Parse options JSON
            // If empty string, make it a parsable json object.
            options = JSON.parse(options || "{}");
            // Create new video.js instance.
            VideoJS.players[vid.id] = new VideoJS(vid, options);
          }
        }

      // If getAttribute isn't defined, we need to wait for the DOM.
      } else {
        _V_.loadPlayerTimeout(1);
        break;
      }
    }
  } else {
    _V_.loadPlayerTimeout(1);
  }
};
_V_.loadPlayerTimeout = function(wait){
  setTimeout(_V_.loadPlayers, wait);
};
_V_.loadPlayerTimeout(1); // Let vjs javascript finish executing

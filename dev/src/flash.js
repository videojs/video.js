/* Flash Player Type
================================================================================ */
VideoJS.fn.extend({

  flashSupported: function(){
    if (!this.flashElement) { this.flashElement = this.getFlashElement(); }
    // Check if object exists & Flash Player version is supported
    return !!(this.flashElement && this.flashPlayerVersionSupported());
  },

  flashInit: function(){
    this.replaceWithFlash();
    this.element = this.flashElement;
    this.video.src = ""; // Stop video from downloading if HTML5 is still supported
    var flashPlayer = VideoJS.flashPlayers[this.options.flashPlayer];
    flashPlayer.init.call(this);
    this.api = flashPlayer.api;
    this.api.setupTriggers.call(this);
  },

  // Get Flash Fallback object element from Embed Code
  getFlashElement: function(){
    var children = this.video.children;
    for (var i=0,j=children.length; i<j; i++) {
      if (children[i].className == "vjs-flash-fallback") {
        return children[i];
      }
    }
  },

  // Used to force a browser to fall back when it's an HTML5 browser but there's no supported sources
  replaceWithFlash: function(){
    // this.flashElement = this.video.removeChild(this.flashElement);
    if (this.flashElement) {
      this.box.insertBefore(this.flashElement, this.video);
      this.video.style.display = "none"; // Removing it was breaking later players
    }
  },

  // Check if browser can use this flash player
  flashPlayerVersionSupported: function(){
    var playerVersion = (this.options.flashPlayerVersion) ? this.options.flashPlayerVersion : VideoJS.flashPlayers[this.options.flashPlayer].flashPlayerVersion;
    return VideoJS.getFlashVersion() >= playerVersion;
  }
});

/* Flash Object Fallback (Flash Player)
================================================================================ */
VideoJS.flashPlayers = {};
VideoJS.flashPlayers.htmlObject = {
  flashPlayerVersion: 9,
  init: function() { return true; },
  api: {} // No video API available with HTML Object embed method
};


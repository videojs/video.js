/* Flash Player Type
================================================================================ */
VideoJS.fn.extend({

  flashSupported: function(){
    return !!this.flashPlayerVersionSupported();
  },

  flashInit: function(){
    this.flashElement = this.getFlashElement();
    this.replaceWithFlash();
    this.element = this.flashElement;
    this.video.src = ""; // Stop video from downloading if HTML5 is still supported
    var flashPlayer = VideoJS.flashPlayers[this.options.flashPlayer];
    this.api = flashPlayer.api;
    flashPlayer.init.call(this);
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

  buildFlashElement: function(){
    this.flashElement = _V_.createElement("object", { 
      id: "flash_fallback_2", 
      className: "vjs-flash-fallback",
      type: "application/x-shockwave-flash",
      data: "http://releases.flowplayer.org/swf/flowplayer-3.2.1.swf"
    });
    // <object width="640" height="264" >

    var params = {
      movie: 'http://releases.flowplayer.org/swf/flowplayer-3.2.1.swf',
      wmode: 'opaque',
      allowfullscreen: 'true',
      flashvars: 'config={"playlist":["http://video-js.zencoder.com/oceans-clip.png", {"url": "http://video-js.zencoder.com/oceans-clip.mp4","autoPlay":false,"autoBuffering":true}]}'
    };
    
    for (var name in params){
      var p = _V_.createElement("param");
      p.name = name;
      p.value = params[name];
      this.flashElement.appendChild(p);
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
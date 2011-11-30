/* Control - Base class for all control elements
================================================================================ */
_V_.Control = _V_.Component.extend({
  init: function(player, options){
    this._super(player, options);
  },

  buildCSSClass: function(){
    return "vjs-control " + this._super();
  }

});

/* Button - Base class for all buttons
================================================================================ */
_V_.Button = _V_.Control.extend({

  init: function(player, options){
    this._super(player, options);

    _V_.addEvent(this.el, "click", _V_.proxy(this, this.onClick));
    _V_.addEvent(this.el, "focus", _V_.proxy(this, this.onFocus));
    _V_.addEvent(this.el, "blur", _V_.proxy(this, this.onBlur));

    return "fdsa";
  },

  createElement: function(type, attrs){
    // Default to Div element
    type = type || "div";

    // Add standard Aria and Tabindex info
    attrs = _V_.merge({
      role: "button",
      tabIndex: 0
    }, attrs || {});

    return this._super(type, {
      className: attrs.className || this.buildCSSClass(),
      innerHTML: attrs.innerHTML || '<div><span class="vjs-control-text">' + (this.buttonText || "Need Text") + '</span></div>'
    });
  },

  // Click - Override with specific functionality for button
  onClick: function(){},

  // Focus - Add keyboard functionality to element
  onFocus: function(){
    _V_.addEvent(document, "keyup", _V_.proxy(this, this.onKeyPress));
  },

  // KeyPress (document level) - Trigger click when keys are pressed
  onKeyPress: function(event){
    // Check for space bar (32) or enter (13) keys
    if (event.which == 32 || event.which == 13) {
      event.preventDefault();
      this.onClick();
    }
  },

  // Blur - Remove keyboard triggers
  onBlur: function(){
    _V_.removeEvent(document, "keyup", _V_.proxy(this, this.onKeyPress));
  }

});

/* Play Button
================================================================================ */
_V_.PlayButton = _V_.Button.extend({

  buttonText: "Play",

  buildCSSClass: function(){
    return "vjs-play-button " + this._super();
  },

  onClick: function(){
    this.player.play();
  }

});

/* Pause Button
================================================================================ */
_V_.PauseButton = _V_.Button.extend({

  buttonText: "Pause",

  buildCSSClass: function(){
    return "vjs-pause-button " + this._super();
  },

  onClick: function(){
    this.player.pause();
  }

});

/* Play Toggle - Play or Pause Media
================================================================================ */
_V_.PlayToggle = _V_.Button.extend({

  buttonText: "Play",

  init: function(player, options){
    this._super(player, options);

    player.addEvent("play", _V_.proxy(this, this.onPlay));
    player.addEvent("pause", _V_.proxy(this, this.onPause));
  },

  buildCSSClass: function(){
    return "vjs-play-control " + this._super();
  },

  // OnClick - Toggle between play and pause
  onClick: function(){
    if (this.player.paused()) {
      this.player.play();
    } else {
      this.player.pause();
    }
  },

  // OnPlay - Add the vjs-playing class to the element so it can change appearance
  onPlay: function(){
    _V_.removeClass(this.el, "vjs-paused");
    _V_.addClass(this.el, "vjs-playing");
  },

  // OnPause - Add the vjs-paused class to the element so it can change appearance
  onPause: function(){
    _V_.removeClass(this.el, "vjs-playing");
    _V_.addClass(this.el, "vjs-paused");
  }

});


/* Fullscreen Toggle Behaviors
================================================================================ */
_V_.FullscreenToggle = _V_.Button.extend({

  buttonText: "Fullscreen",

  buildCSSClass: function(){
    return "vjs-fullscreen-control " + this._super();
  },

  onClick: function(){
    if (!this.player.videoIsFullScreen) {
      this.player.enterFullScreen();
    } else {
      this.player.exitFullScreen();
    }
  }

});

/* Big Play Button
================================================================================ */
_V_.BigPlayButton = _V_.Button.extend({
  init: function(player, options){
    this._super(player, options);

    player.addEvent("play", _V_.proxy(this, this.hide));
    player.addEvent("ended", _V_.proxy(this, this.show));
  },

  createElement: function(){
    return this._super("div", {
      className: "vjs-big-play-button",
      innerHTML: "<span></span>"
    });
  },

  onClick: function(){
    this.player.play();
  }
});

/* Control Bar
================================================================================ */
_V_.ControlBar = _V_.Component.extend({
  init: function(player, options){
    this._super(player, options);

    // player.addEvent("mouseover", _V_.proxy(this, this.show));
    // player.addEvent("mouseout", _V_.proxy(this, this.hide));
  },

  createElement: function(){
    return _V_.createElement("div", {
      className: "vjs-controls"
    });
  },

  show: function(){
    // Used for transitions (fading out)
    this.el.style.opacity = 1;
    // bar.style.display = "block";
  },

  hide: function(){
    this.el.style.opacity = 0;
    // bar.style.display = "none";
  }
});

/* Time
================================================================================ */
_V_.CurrentTimeDisplay = _V_.Component.extend({

  init: function(player, options){
    this._super(player, options);

    player.addEvent("timeupdate", _V_.proxy(this, this.updateContent));
  },

  createElement: function(){
    var el = this._super("div", {
      className: "vjs-current-time vjs-time-controls vjs-control"
    });

    this.content = _V_.createElement("div", {
      className: "vjs-current-time-display",
      innerHTML: '0:00'
    });

    el.appendChild(_V_.createElement("div").appendChild(this.content));
    return el;
  },

  updateContent: function(){
    // Allows for smooth scrubbing, when player can't keep up.
    var time = (this.player.scrubbing) ? this.player.values.currentTime : this.player.currentTime();
    this.content.innerHTML = _V_.formatTime(time, this.player.duration());
  }

});

_V_.DurationDisplay = _V_.Component.extend({

  init: function(player, options){
    this._super(player, options);

    player.addEvent("timeupdate", _V_.proxy(this, this.updateContent));
  },

  createElement: function(){
    var el = this._super("div", {
      className: "vjs-duration vjs-time-controls vjs-control"
    });

    this.content = _V_.createElement("div", {
      className: "vjs-duration-display",
      innerHTML: '0:00'
    });

    el.appendChild(_V_.createElement("div").appendChild(this.content));
    return el;
  },

  updateContent: function(){
    if (this.player.duration()) { this.content.innerHTML = _V_.formatTime(this.player.duration()); }
  }

});

// Time Separator (Not used in main skin, but still available, and could be used as a 'spare element')
_V_.TimeDivider = _V_.Component.extend({

  createElement: function(){
    return this._super("div", {
      className: "vjs-time-divider",
      innerHTML: '<div><span>/</span></div>'
    });
  }

});

_V_.RemainingTimeDisplay = _V_.Component.extend({

  init: function(player, options){
    this._super(player, options);

    player.addEvent("timeupdate", _V_.proxy(this, this.updateContent));
  },

  createElement: function(){
    var el = this._super("div", {
      className: "vjs-remaining-time vjs-time-controls vjs-control"
    });

    this.content = _V_.createElement("div", {
      className: "vjs-remaining-time-display",
      innerHTML: '-0:00'
    });

    el.appendChild(_V_.createElement("div").appendChild(this.content));
    return el;
  },

  updateContent: function(){
    if (this.player.duration()) { this.content.innerHTML = "-"+_V_.formatTime(this.player.remainingTime()); }

    // Allows for smooth scrubbing, when player can't keep up.
    // var time = (this.player.scrubbing) ? this.player.values.currentTime : this.player.currentTime();
    // this.content.innerHTML = _V_.formatTime(time, this.player.duration());
  }

});

/* Progress
================================================================================ */

// Progress Control: Seek, Load Progress, and Play Progress
_V_.ProgressControl = _V_.Component.extend({

  createElement: function(){
    return this._super("div", {
      className: "vjs-progress-control vjs-control"
    });
  }

});

// Seek Bar and holder for the progress bars
_V_.SeekBar = _V_.Component.extend({

  init: function(player, options){
    this._super(player, options);

    _V_.each.call(this, this.components, function(comp){
      if (comp instanceof _V_.PlayProgressBar) {
        this.playProgressBar = comp;
      } else if (comp instanceof _V_.SeekHandle) {
        this.seekHandle = comp;
      }
    });

    player.addEvent("timeupdate", _V_.proxy(this, this.update));

    _V_.addEvent(this.el, "mousedown", _V_.proxy(this, this.onMouseDown));
    _V_.addEvent(this.el, "focus", _V_.proxy(this, this.onFocus));
    _V_.addEvent(this.el, "blur", _V_.proxy(this, this.onBlur));

    // _V_.addEvent(element, "mousedown", _V_.proxy(element, function(event){
    //   player.onSeekBarMouseDown(event, this);
    // }));
  },

  createElement: function(){
    return this._super("div", {
      className: "vjs-progress-holder"
    });
  },

  update: function(){
    // If scrubbing, use the cached currentTime value for speed
    var progress =  /* (this.player.scrubbing) ? this.player.values.currentTime / this.player.duration() : */ this.player.currentTime() / this.player.duration();
    // Protect against no duration and other division issues
    if (isNaN(progress)) { progress = 0; }

    var // barData = _V_.getData(bar),
        barX = _V_.findPosX(this.el),
        barW = this.el.offsetWidth,
        handle = this.seekHandle,
        progBar = this.playProgressBar,
        handleW = (handle) ? handle.el.offsetWidth : 0;

        // Adjusted X and Width, so handle doesn't go outside the bar
        barAX = barX + (handleW / 2),
        barAW = barW - handleW,
        progBarProgress = _V_.round(progress * barAW + handleW / 2) + "px";

    if (progBar && progBar.el.style) {
      progBar.el.style.width = progBarProgress;
    }

    if (handle) {
      handle.el.style.left = _V_.round(progress * barAW)+"px";
    }
  },

  onMouseDown: function(event){
    event.preventDefault();
    _V_.blockTextSelection();

    this.player.currSeekBar = this;
    this.player.currHandle = this.seekHandle || false;

    this.player.scrubbing = true;

    this.player.videoWasPlaying = !this.player.paused();
    this.player.pause();

    this.setCurrentTimeWithScrubber(event);
    _V_.addEvent(document, "mousemove", _V_.proxy(this, this.onMouseMove));
    _V_.addEvent(document, "mouseup", _V_.proxy(this, this.onMouseUp));
  },

  setCurrentTimeWithScrubber: function(event){
    var bar = this.el,
        barX = _V_.findPosX(bar),
        barW = bar.offsetWidth,
        handle = this.player.currHandle.el,
        handleW = (handle) ? handle.offsetWidth : 0;

        // Adjusted X and Width, so handle doesn't go outside the bar
        barAX = barX + (handleW / 2),
        barAW = barW - handleW,
        // Percent that the click is through the adjusted area
        percent = Math.max(0, Math.min(1, (event.pageX - barAX) / barAW)),
        // Percent translated to pixels
        percentPix = percent * barAW,
        // Percent translated to seconds
        newTime = percent * this.player.duration();

    // Don't let video end while scrubbing.
    if (newTime == this.player.duration()) { newTime = newTime - 0.1; }

    // Set new time (tell player to seek to new time)
    this.player.currentTime(newTime);
  },

  onMouseMove: function(event){ // Removeable
    this.setCurrentTimeWithScrubber(event);
  },
  onMouseUp: function(event){ // Removeable
    _V_.unblockTextSelection();
    _V_.removeEvent(document, "mousemove", this.onMouseMove, false);
    _V_.removeEvent(document, "mouseup", this.onMouseUp, false);
    this.player.scrubbing = false;
    if (this.player.videoWasPlaying) {
      this.player.play();
    }
  },

  onFocus: function(event){
    _V_.addEvent(document, "keyup", _V_.proxy(this, this.onKeyPress));
  },
  onKeyPress: function(event){
    if (event.which == 37) {
      event.preventDefault();
      this.player.currentTime(this.player.currentTime() - 1);
    } else if (event.which == 39) {
      event.preventDefault();
      this.player.currentTime(this.player.currentTime() + 1);
    }
  },
  onBlur: function(event){
     _V_.removeEvent(document, "keyup", _V_.proxy(this, this.onKeyPress));
  }

});

// Load Progress Bar
_V_.LoadProgressBar = _V_.Component.extend({

  init: function(player, options){
    this._super(player, options);
    player.addEvent("progress", _V_.proxy(this, this.update));
  },

  createElement: function(){
    return this._super("div", {
      className: "vjs-load-progress",
      innerHTML: '<span class="vjs-control-text">Loaded: 0%</span>'
    });
  },

  update: function(){
    if (this.el.style) { this.el.style.width = _V_.round(this.player.bufferedPercent() * 100, 2) + "%"; }
  }

});

// Play Progress Bar
_V_.PlayProgressBar = _V_.Component.extend({

  createElement: function(){
    return this._super("div", {
      className: "vjs-play-progress",
      innerHTML: '<span class="vjs-control-text">Progress: 0%</span>'
    });
  }

});

// Seek Handle
// SeekBar Behavior includes play progress bar, and seek handle
// Needed so it can determine seek position based on handle position/size
_V_.SeekHandle = _V_.Component.extend({

  createElement: function(){
    return this._super("div", {
      className: "vjs-seek-handle",
      innerHTML: '<span class="vjs-control-text">00:00</span>',
      tabIndex: 0,
      role: "slider", "aria-valuenow": 0, "aria-valuemin": 0, "aria-valuemax": 100
    });
  }

});

/* Volume Scrubber
================================================================================ */
// Progress Control: Seek, Load Progress, and Play Progress
_V_.VolumeControl = _V_.Component.extend({

  createElement: function(){
    return this._super("div", {
      className: "vjs-volume-control vjs-control"
    });
  }

});

_V_.VolumeBar = _V_.Component.extend({

  init: function(player, options){
    this._super(player, options);

    _V_.each.call(this, this.components, function(comp){
      if (comp instanceof _V_.VolumeLevel) {
        this.volumeLevel = comp;
      } else if (comp instanceof _V_.VolumeHandle) {
        this.volumeHandle = comp;
      }
    });

    player.addEvent("volumechange", _V_.proxy(this, this.update));

    _V_.addEvent(this.el, "mousedown", _V_.proxy(this, this.onMouseDown));
    // _V_.addEvent(this.el, "focus", _V_.proxy(this, this.onFocus));
    // _V_.addEvent(this.el, "blur", _V_.proxy(this, this.onBlur));
  },

  createElement: function(){
    return this._super("div", {
      className: "vjs-volume-bar"
    });
  },

  onMouseDown: function(event){
    event.preventDefault();
    _V_.blockTextSelection();

    this.player.currVolumeBar = this;
    this.player.currHandle = this.volumeHandle || false;

    this.setVolumeWithSlider(event);
    _V_.addEvent(document, "mousemove", _V_.proxy(this, this.onMouseMove));
    _V_.addEvent(document, "mouseup", _V_.proxy(this, this.onMouseUp));
  },
  onMouseMove: function(event){ // Removeable
    this.setVolumeWithSlider(event);
  },
  onMouseUp: function(event){ // Removeable
    _V_.unblockTextSelection();
    _V_.removeEvent(document, "mousemove", this.onMouseMove, false);
    _V_.removeEvent(document, "mouseup", this.onMouseUp, false);
  },

  setVolumeWithSlider: function(event){
    var bar = this.el,
        barX = _V_.findPosX(bar),
        barW = bar.offsetWidth,
        handle = (this.player.currHandle) ? this.player.currHandle.el : false,
        handleW = (handle) ? handle.offsetWidth : 0;

        // Adjusted X and Width, so handle doesn't go outside the bar
        barAX = barX + (handleW / 2),
        barAW = barW - handleW,
        // Percent that the click is through the adjusted area
        percent = Math.max(0, Math.min(1, (event.pageX - barAX) / barAW)),
        // Percent translated to pixels
        percentPix = percent * barAW,
        // Percent translated to seconds
        newTime = percent * this.player.duration();

    this.player.volume(percent);
  },

  update: function(){
     var vol = this.player.volume();

     var bar = this.el;
         barX = _V_.findPosX(bar),
         barW = bar.offsetWidth,
         handle = (this.volumeHandle) ? this.volumeHandle.el : false,
         level = (this.volumeLevel) ? this.volumeLevel.el : false,
         handleW = (handle) ? handle.offsetWidth : 0;

         // Adjusted X and Width, so handle doesn't go outside the bar
         barAX = barX + (handleW / 2),
         barAW = barW - handleW,
         progBarProgress = _V_.round(vol * barAW + handleW / 2) + "px";

     if (level) {
       level.style.width = progBarProgress;
     }

     if (handle) {
       handle.style.left = _V_.round(vol * barAW)+"px";
     }
   }

});

_V_.VolumeLevel = _V_.Component.extend({

  createElement: function(){
    return this._super("div", {
      className: "vjs-volume-level",
      innerHTML: '<span class="vjs-control-text"></span>'
    });
  }

});

_V_.VolumeHandle = _V_.Component.extend({

  createElement: function(){
    return this._super("div", {
      className: "vjs-volume-handle",
      innerHTML: '<span class="vjs-control-text"></span>',
      tabindex: 0,
      role: "slider", "aria-valuenow": 0, "aria-valuemin": 0, "aria-valuemax": 100
    });
  }

});

_V_.MuteToggle = _V_.Button.extend({

  init: function(player, options){
    this._super(player, options);

    player.addEvent("volumechange", _V_.proxy(this, this.update));
  },

  createElement: function(){
    return this._super("div", {
      className: "vjs-mute-control vjs-control",
      innerHTML: '<div><span class="vjs-control-text">Mute</span></div>'
    });
  },

  onClick: function(event){
    this.player.muted( this.player.muted() ? false : true );
  },

  update: function(event){
    var vol = this.player.volume(),
        level = 3;

    if (vol == 0 || this.player.muted()) {
      level = 0;
    } else if (vol < 0.33) {
      level = 1;
    } else if (vol < 0.67) {
      level = 2;
    }

    /* TODO improve muted icon classes */
    _V_.each.call(this, [0,1,2,3], function(i){
      _V_.removeClass(this.el, "vjs-vol-"+i);
    });
    _V_.addClass(this.el, "vjs-vol-"+level);
  }

});


/* Text Track Displays
================================================================================ */
// Create a behavior type for each text track type (subtitlesDisplay, captionsDisplay, etc.).
// Then you can easily do something like.
//    player.addBehavior(myDiv, "subtitlesDisplay");
// And the myDiv's content will be updated with the text change.

// Base class for all track displays. Should not be instantiated on its own.
_V_.TextTrackDisplay = _V_.Component.extend({

  init: function(player, options){
    this._super(player, options);

    player.addEvent(this.trackType + "update", _V_.proxy(this, this.update));
  },

  createElement: function(){
    return this._super("div", {
      className: "vjs-" + this.trackType
    });
  },

  update: function(){
    this.el.innerHTML = this.player.textTrackValue(this.trackType);
  }

});

_V_.SubtitlesDisplay = _V_.TextTrackDisplay.extend({

  trackType: "subtitles"

});
_V_.CaptionsDisplay = _V_.TextTrackDisplay.extend({

  trackType: "captions"

});
_V_.ChaptersDisplay = _V_.TextTrackDisplay.extend({

  trackType: "chapters"

});
_V_.DescriptionsDisplay = _V_.TextTrackDisplay.extend({

  trackType: "descriptions"

});
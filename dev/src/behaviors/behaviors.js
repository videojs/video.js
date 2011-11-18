/* Box Behaviors - The primary container element
================================================================================ */
VideoJS.fn.newBehavior("box", 
  function(element){
    _V_.addClass(element, "vjs-paused");
    this.addEvent("play", this.boxOnVideoPlay);
    this.addEvent("pause", this.boxOnVideoPause);
  },
  function(){},
  {
    boxOnVideoPlay: function(){
      _V_.removeClass(this.box, "vjs-paused");
      _V_.addClass(this.box, "vjs-playing");
    },
    boxOnVideoPause: function(){
      _V_.removeClass(this.box, "vjs-playing");
      _V_.addClass(this.box, "vjs-paused");
    }
  }
);

/* Playback Technology Element Behaviors
================================================================================ */
VideoJS.fn.newBehavior("tech", 
  function(element){
    // Need to add click event to video element instead of box, otherwise box will
    // catch clicks on all control buttons. (Could add stopPropagation to all, but don't want to if not needed yet.)
    _V_.addEvent(element, "click", _V_.proxy(this, this.onPlayToggleClick));
  },
  function(element){
    _V_.removeEvent(element, "click", this.onPlayToggleClick);
  },
  {}
);

/* Control Bar Behaviors
================================================================================ */
VideoJS.fn.newBehavior("controlBar",
  function(element){
    if (!this.bels.controlBars) {
      this.bels.controlBars = [];
      // this.addEvent("mouseover", this.showControlBars);
      // this.addEvent("mouseout", this.hideControlBars);
    }
    this.bels.controlBars.push(element);
  },
  function(element){},
  {
    showControlBars: function(){
      this.each(this.bels.controlBars, function(bar){
        bar.style.opacity = 1;
        // bar.style.display = "block";
      });
    },
    hideControlBars: function(){
      this.each(this.bels.controlBars, function(bar){
        bar.style.opacity = 0;
        // bar.style.display = "none";
      });
    }
  }
);

/* PlayToggle, PlayButton, PauseButton Behaviors
================================================================================ */
// Play Toggle
VideoJS.fn.newBehavior("playToggle", function(element){
    if (!this.bels.playToggles) {
      this.bels.playToggles = [];
      this.addEvent("play", this.playTogglesOnPlay);
      this.addEvent("pause", this.playTogglesOnPause);
    }
    this.bels.playToggles.push(element);
    _V_.addEvent(element, "click", _V_.proxy(this, this.onPlayToggleClick));
    _V_.addEvent(element, "focus", _V_.proxy(this, this.onPlayToggleFocus));
    _V_.addEvent(element, "blur", _V_.proxy(this, this.onPlayToggleBlur));
  },
  function(){},
  {
    onPlayToggleClick: function(event){
      if (this.paused()) {
        this.play();
      } else {
        this.pause();
      }
    },
    playTogglesOnPlay: function(event){
      this.each(this.bels.playToggles, function(toggle){
        _V_.removeClass(toggle, "vjs-paused");
        _V_.addClass(toggle, "vjs-playing");
      });
    },
    playTogglesOnPause: function(event){
      this.each(this.bels.playToggles, function(toggle){
        _V_.removeClass(toggle, "vjs-playing");
        _V_.addClass(toggle, "vjs-paused");
      });
    },
    onPlayToggleFocus: function(event){
      _V_.addEvent(document, "keyup", _V_.proxy(this, this.onPlayToggleKey));
    },
    onPlayToggleKey: function(event){
      if (event.which == 32 || event.which == 13) {
        event.preventDefault();
        this.onPlayToggleClick();
      }
    },
    onPlayToggleBlur: function(event){
       _V_.removeEvent(document, "keyup", _V_.proxy(this, this.onPlayToggleKey));
    }
  }
);
// Play
VideoJS.fn.newBehavior("playButton", function(element){
    _V_.addEvent(element, "click", _V_.proxy(this, this.onPlayButtonClick));
  },
  function(){},
  {
    onPlayButtonClick: function(event){ this.play(); }
  }
);
// Pause
VideoJS.fn.newBehavior("pauseButton", function(element){
    _V_.addEvent(element, "click", _V_.proxy(this, this.onPauseButtonClick));
  },
  function(){},
  {
    onPauseButtonClick: function(event){ this.pause(); }
  }
);

/* Current Time Display Behaviors
================================================================================ */
VideoJS.fn.newBehavior("currentTimeDisplay", function(element){
    if (!this.bels.currentTimeDisplays) {
      this.bels.currentTimeDisplays = [];
      this.addEvent("timeupdate", this.updateCurrentTimeDisplays);
    }
    this.bels.currentTimeDisplays.push(element);
  },
  function(){},
  {
    // Update the displayed time (00:00)
    updateCurrentTimeDisplays: function(newTime){
      // Allows for smooth scrubbing, when player can't keep up.
      var time = (this.scrubbing) ? this.values.currentTime : this.currentTime();
      this.each(this.bels.currentTimeDisplays, function(dis){
        dis.innerHTML = _V_.formatTime(time, this.duration());
      });
    }
  }
);

/* Duration Display Behaviors
================================================================================ */
VideoJS.fn.newBehavior("durationDisplay", function(element){
    if (!this.bels.durationDisplays) {
      this.bels.durationDisplays = [];
      this.addEvent("timeupdate", this.updateDurationDisplays);
    }
    this.bels.durationDisplays.push(element);
  },
  function(){},
  {
    updateDurationDisplays: function(){
      this.each(this.bels.durationDisplays, function(dis){
        if (this.duration()) { dis.innerHTML = _V_.formatTime(this.duration()); }
      });
    }
  }
);

/* Duration Display Behaviors
================================================================================ */
VideoJS.fn.newBehavior("remainingTimeDisplay", function(element){
    if (!this.bels.remainingTimeDisplays) {
      this.bels.remainingTimeDisplays = [];
      this.addEvent("timeupdate", this.updateRemainingTimeDisplays);
    }
    this.bels.remainingTimeDisplays.push(element);
  },
  function(){},
  {
    updateRemainingTimeDisplays: function(){
      this.each(this.bels.remainingTimeDisplays, function(dis){
        if (this.duration()) { dis.innerHTML = "-"+_V_.formatTime(this.remainingTime()); }
      });
    }
  }
);

/* Time Left (remaining) Display Behaviors
================================================================================ */
VideoJS.fn.newBehavior("timeLeftDisplay", function(element){
    if (!this.bels.timeLeftDisplays) {
      this.bels.timeLeftDisplays = [];
      this.addEvent("timeupdate", this.updateTimeLeftDisplays);
    }
    this.bels.timeLeftDisplays.push(element);
  },
  function(){
    this.removeEvent("timeupdate", this.updateTimeLeftDisplays);
    delete this.bels.timeLeftDisplays;
  },
  {
    updateTimeLeftDisplays: function(){
      // Allows for smooth scrubbing, when player can't keep up.
      var time = (this.scrubbing) ? this.values.currentTime : this.currentTime();
      this.each(this.bels.timeLeftDisplays, function(dis){
        dis.innerHTML = "-" + _V_.formatTime(this.duration() - time);
      });
    }
  }
);

/* Volume Scrubber Behaviors
================================================================================ */
VideoJS.fn.newBehavior("volumeScrubber", function(element){
    // Binding with element as 'this' so the progress holder element can be retrieved in IE.
    // IE doesn't support the currentTarget event attr.
    var player = this;
    _V_.addEvent(element, "mousedown", _V_.proxy(element, function(e){
      player.onVolumeScrubberMouseDown(e, this);
    }));
  },
  function(){},
  {
    // Adjust the volume when the user drags on the volume control
    onVolumeScrubberMouseDown: function(event, scrubber){
      // event.preventDefault();
      _V_.blockTextSelection();
      this.currentScrubber = scrubber;
      this.setVolumeWithScrubber(event);
      _V_.addEvent(document, "mousemove", _V_.proxy(this, this.onVolumeScrubberMouseMove));
      _V_.addEvent(document, "mouseup", _V_.proxy(this, this.onVolumeScrubberMouseUp));
    },
    onVolumeScrubberMouseMove: function(event){
      this.setVolumeWithScrubber(event);
    },
    onVolumeScrubberMouseUp: function(event){
      this.setVolumeWithScrubber(event);
      _V_.unblockTextSelection();
      _V_.removeEvent(document, "mousemove", this.onVolumeScrubberMouseMove, false);
      _V_.removeEvent(document, "mouseup", this.onVolumeScrubberMouseUp, false);
    },
    setVolumeWithScrubber: function(event){
      var newVol = _V_.getRelativePosition(event.pageX, this.currentScrubber);
      this.volume(newVol);
    }
  }
);

/* Volume Display Behaviors
================================================================================ */
VideoJS.fn.newBehavior("volumeDisplay", function(element){
    if (!this.bels.volumeDisplays) {
      this.bels.volumeDisplays = [];
      this.addEvent("volumechange", this.updateVolumeDisplays);
    }
    this.bels.volumeDisplays.push(element);
    this.updateVolumeDisplay(element); // Set the display to the initial volume
  },
  function(){},
  {
    // Update the volume control display
    // Unique to these default controls. Uses borders to create the look of bars.
    updateVolumeDisplays: function(){
      if (!this.bels.volumeDisplays) { return; }
      this.each(this.bels.volumeDisplays, function(dis){
        this.updateVolumeDisplay(dis);
      });
    },
    updateVolumeDisplay: function(display){
      var volNum = Math.ceil(this.volume() * 6);
      this.each(display.children, function(child, num){
        if (num < volNum) {
          _V_.addClass(child, "vjs-volume-level-on");
        } else {
          _V_.removeClass(child, "vjs-volume-level-on");
        }
      });
    }
  }
);

/* Fullscreen Toggle Behaviors
================================================================================ */
VideoJS.fn.newBehavior("fullscreenToggle", function(element){
    _V_.addEvent(element, "click", _V_.proxy(this, this.onFullscreenToggleClick));
  },
  function(){},
  {
    // When the user clicks on the fullscreen button, update fullscreen setting
    onFullscreenToggleClick: function(event){
      if (!this.videoIsFullScreen) {
        this.enterFullScreen();
      } else {
        this.exitFullScreen();
      }
    },

    fullscreenOnWindowResize: function(event){ // Removeable
      // this.positionControlBars();
    },
    // Create listener for esc key while in full screen mode
    fullscreenOnEscKey: function(event){ // Removeable
      if (event.keyCode == 27) {
        this.exitFullScreen();
      }
    }
  }
);

////////////////////////////////////////////////////////////////////////////////
// Element Behaviors
// Tell elements how to act or react
////////////////////////////////////////////////////////////////////////////////

/* Player Behaviors - How VideoJS reacts to what the video is doing.
================================================================================ */
VideoJS.player.newBehavior("player", function(player){
    this.onError(this.playerOnVideoError);
    // Listen for when the video is played
    this.onPlay(this.playerOnVideoPlay);
    // Listen for when the video is paused
    this.onPause(this.playerOnVideoPause);
    // Listen for when the video ends
    this.onEnded(this.playerOnVideoEnded);
    // Set interval for load progress using buffer watching method
    this.trackCurrentTime();
    this.trackBuffered();
    // Buffer Full
    this.onBufferedUpdate(this.isBufferFull);
  },{
    playerOnVideoError: function(event){ 
      this.log(this.video.error); 
      console.log(event)
    },
    playerOnVideoPlay: function(event){ this.hasPlayed = true; },
    playerOnVideoPause: function(event){},
    playerOnVideoEnded: function(event){
      this.currentTime(0);
      this.pause();
    },

    /* Load Tracking -------------------------------------------------------------- */
    // Buffer watching method for load progress.
    // Used for browsers that don't support the progress event
    trackBuffered: function(){
      this.bufferedInterval = setInterval(this.triggerBufferedListeners.context(this), 100);
    },
    stopTrackingBuffered: function(){ clearInterval(this.bufferedInterval); },
    bufferedListeners: [],
    onBufferedUpdate: function(fn){
      this.bufferedListeners.push(fn);
    },
    triggerBufferedListeners: function(){
      this.each(this.bufferedListeners, function(listener){
        (listener.context(this))();
      });
    },
    isBufferFull: function(){
      if (this.bufferedPercent() == 1) { this.stopTrackingBuffered(); }
    },

    /* Time Tracking -------------------------------------------------------------- */
    trackCurrentTime: function(){
      if (this.currentTimeInterval) { clearInterval(this.currentTimeInterval); }
      this.currentTimeInterval = setInterval(this.triggerCurrentTimeListeners.context(this), 42); // 24 fps
      this.trackingCurrentTime = true;
    },
    // Turn off play progress tracking (when paused or dragging)
    stopTrackingCurrentTime: function(){
      clearInterval(this.currentTimeInterval);
      this.trackingCurrentTime = false;
    },
    currentTimeListeners: [],
    onCurrentTimeUpdate: function(fn){
      this.currentTimeListeners.push(fn);
    },
    triggerCurrentTimeListeners: function(late, newTime){ // FF passes milliseconds late a the first argument
      this.each(this.currentTimeListeners, function(listener){
        (listener.context(this))(newTime);
      });
    },

    /* Resize Tracking -------------------------------------------------------------- */
    resizeListeners: [],
    onResize: function(fn){
      this.resizeListeners.push(fn);
    },
    // Trigger anywhere the video/box size is changed.
    triggerResizeListeners: function(){
      this.each(this.resizeListeners, function(listener){
        (listener.context(this))();
      });
    }
  }
);
/* Mouse Over Video Reporter Behaviors - i.e. Controls hiding based on mouse location
================================================================================ */
VideoJS.player.newBehavior("mouseOverVideoReporter", function(element){
    // Listen for the mouse move the video. Used to reveal the controller.
    element.addEventListener("mousemove", this.mouseOverVideoReporterOnMouseMove.context(this), false);
    // Listen for the mouse moving out of the video. Used to hide the controller.
    element.addEventListener("mouseout", this.mouseOverVideoReporterOnMouseOut.context(this), false);
  },{
    mouseOverVideoReporterOnMouseMove: function(){
      this.showControlBars();
      clearInterval(this.mouseMoveTimeout);
      this.mouseMoveTimeout = setTimeout(this.hideControlBars.context(this), 4000);
    },
    mouseOverVideoReporterOnMouseOut: function(event){
      // Prevent flicker by making sure mouse hasn't left the video
      var parent = event.relatedTarget;
      while (parent && parent !== this.box) {
        parent = parent.parentNode;
      }
      if (parent !== this.box) {
        this.hideControlBars();
      }
    }
  }
);
/* Mouse Over Video Reporter Behaviors - i.e. Controls hiding based on mouse location
================================================================================ */
VideoJS.player.newBehavior("box", function(element){
    this.positionBox();
    _V_.addClass(element, "vjs-paused");
    this.activateElement(element, "mouseOverVideoReporter");
    this.onPlay(this.boxOnVideoPlay);
    this.onPause(this.boxOnVideoPause);
  },{
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
/* Poster Image Overlay
================================================================================ */
VideoJS.player.newBehavior("poster", function(element){
    this.activateElement(element, "mouseOverVideoReporter");
    this.activateElement(element, "playButton");
    this.onPlay(this.hidePoster);
    this.onEnded(this.showPoster);
    this.onResize(this.positionPoster);
  },{
    showPoster: function(){
      if (!this.poster) { return; }
      this.poster.style.display = "block";
      this.positionPoster();
    },
    positionPoster: function(){
      // Only if the poster is visible
      if (!this.poster || this.poster.style.display == 'none') { return; }
      this.poster.style.height = this.height() + "px"; // Need incase controlsBelow
      this.poster.style.width = this.width() + "px"; // Could probably do 100% of box
    },
    hidePoster: function(){
      if (!this.poster) { return; }
      this.poster.style.display = "none";
    },
    // Update poster source from attribute or fallback image
    // iPad breaks if you include a poster attribute, so this fixes that
    updatePosterSource: function(){
      if (!this.video.poster) {
        var images = this.video.getElementsByTagName("img");
        if (images.length > 0) { this.video.poster = images[0].src; }
      }
    }
  }
);
/* Control Bar Behaviors
================================================================================ */
VideoJS.player.newBehavior("controlBar", function(element){
    if (!this.controlBars) { 
      this.controlBars = []; 
      this.onResize(this.positionControlBars);
    }
    this.controlBars.push(element);
    element.addEventListener("mousemove", this.onControlBarsMouseMove.context(this), false);
    element.addEventListener("mouseout", this.onControlBarsMouseOut.context(this), false);
  },{
    showControlBars: function(){
      if (!this.options.controlsAtStart && !this.hasPlayed) { return; }
      this.each(this.controlBars, function(bar){
        bar.style.display = "block";
      });
    },
    // Place controller relative to the video's position (now just resizing bars)
    positionControlBars: function(){
      this.updatePlayProgressBars();
      this.updateLoadProgressBars();
    },
    hideControlBars: function(){
      if (this.options.controlsHiding && !this.mouseIsOverControls) { 
        this.each(this.controlBars, function(bar){
          bar.style.display = "none";
        });
      }
    },
    // Block controls from hiding when mouse is over them.
    onControlBarsMouseMove: function(){ this.mouseIsOverControls = true; },
    onControlBarsMouseOut: function(event){ 
      this.mouseIsOverControls = false; 
    }
  }
);
/* PlayToggle, PlayButton, PauseButton Behaviors
================================================================================ */
// Play Toggle
VideoJS.player.newBehavior("playToggle", function(element){
    element.addEventListener("click", this.onPlayToggleClick.context(this), false);
  },{
    onPlayToggleClick: function(event){
      if (this.paused()) {
        this.play();
      } else {
        this.pause();
      }
    }
  }
);
// Play
VideoJS.player.newBehavior("playButton", function(element){
    element.addEventListener("click", this.onPlayButtonClick.context(this), false);
  },{
    onPlayButtonClick: function(event){ this.play(); }
  }
);
// Pause
VideoJS.player.newBehavior("pauseButton", function(element){
    element.addEventListener("click", this.onPauseButtonClick.context(this), false);
  },{
    onPauseButtonClick: function(event){ this.pause(); }
  }
);
/* Play Progress Bar Behaviors
================================================================================ */
VideoJS.player.newBehavior("playProgressBar", function(element){
    if (!this.playProgressBars) { 
      this.playProgressBars = [];
      this.onCurrentTimeUpdate(this.updatePlayProgressBars);
    }
    this.playProgressBars.push(element);
  },{
    // Ajust the play progress bar's width based on the current play time
    updatePlayProgressBars: function(newTime){
      var progress = (newTime !== undefined) ? newTime / this.duration() : this.currentTime() / this.duration();
      this.each(this.playProgressBars, function(bar){
        if (bar.style) { bar.style.width = _V_.round(progress * 100, 2) + "%"; }
      });
    }
  }
);
/* Load Progress Bar Behaviors
================================================================================ */
VideoJS.player.newBehavior("loadProgressBar", function(element){
    if (!this.loadProgressBars) { this.loadProgressBars = []; }
    this.loadProgressBars.push(element);
    this.onBufferedUpdate(this.updateLoadProgressBars);
  },{
    updateLoadProgressBars: function(){
      this.each(this.loadProgressBars, function(bar){
        if (bar.style) { bar.style.width = _V_.round(this.bufferedPercent() * 100, 2) + "%"; }
      });
    }
  }
);

/* Current Time Display Behaviors
================================================================================ */
VideoJS.player.newBehavior("currentTimeDisplay", function(element){
    if (!this.currentTimeDisplays) { 
      this.currentTimeDisplays = []; 
      this.onCurrentTimeUpdate(this.updateCurrentTimeDisplays);
    }
    this.currentTimeDisplays.push(element);
  },{
    // Update the displayed time (00:00)
    updateCurrentTimeDisplays: function(newTime){
      if (!this.currentTimeDisplays) { return; }
      // Allows for smooth scrubbing, when player can't keep up.
      var time = (newTime) ? newTime : this.currentTime();
      this.each(this.currentTimeDisplays, function(dis){
        dis.innerHTML = _V_.formatTime(time);
      });
    }
  }
);

/* Duration Display Behaviors
================================================================================ */
VideoJS.player.newBehavior("durationDisplay", function(element){
    if (!this.durationDisplays) { 
      this.durationDisplays = []; 
      this.onCurrentTimeUpdate(this.updateDurationDisplays);
    }
    this.durationDisplays.push(element);
  },{
    updateDurationDisplays: function(){
      if (!this.durationDisplays) { return; }
      this.each(this.durationDisplays, function(dis){
        if (this.duration()) { dis.innerHTML = _V_.formatTime(this.duration()); }
      });
    }
  }
);

/* Current Time Scrubber Behaviors
================================================================================ */
VideoJS.player.newBehavior("currentTimeScrubber", function(element){
    element.addEventListener("mousedown", this.onCurrentTimeScrubberMouseDown.rEvtContext(this), false);
  },{
    // Adjust the play position when the user drags on the progress bar
    onCurrentTimeScrubberMouseDown: function(event, scrubber){
      event.preventDefault();
      this.currentScrubber = scrubber;

      this.stopTrackingCurrentTime(); // Allows for smooth scrubbing

      this.videoWasPlaying = !this.paused();
      this.pause();

      _V_.blockTextSelection();
      this.setCurrentTimeWithScrubber(event);
      document.addEventListener("mousemove", this.onCurrentTimeScrubberMouseMove.rEvtContext(this), false);
      document.addEventListener("mouseup", this.onCurrentTimeScrubberMouseUp.rEvtContext(this), false);
    },
    onCurrentTimeScrubberMouseMove: function(event){ // Removeable
      this.setCurrentTimeWithScrubber(event);
    },
    onCurrentTimeScrubberMouseUp: function(event){ // Removeable
      _V_.unblockTextSelection();
      document.removeEventListener("mousemove", this.onCurrentTimeScrubberMouseMove, false);
      document.removeEventListener("mouseup", this.onCurrentTimeScrubberMouseUp, false);
      if (this.videoWasPlaying) {
        this.play();
        this.trackCurrentTime();
      }
    },
    setCurrentTimeWithScrubber: function(event){
      var newProgress = _V_.getRelativePosition(event.pageX, this.currentScrubber);
      var newTime = newProgress * this.duration();
      this.triggerCurrentTimeListeners(0, newTime); // Allows for smooth scrubbing
      // Don't let video end while scrubbing.
      if (newTime == this.duration()) { newTime = newTime - 0.1; }
      this.currentTime(newTime);
    }
  }
);
/* Volume Display Behaviors
================================================================================ */
VideoJS.player.newBehavior("volumeDisplay", function(element){
    if (!this.volumeDisplays) { 
      this.volumeDisplays = [];
      this.onVolumeChange(this.updateVolumeDisplays);
    }
    this.volumeDisplays.push(element);
    this.updateVolumeDisplay(element); // Set the display to the initial volume
  },{
    // Update the volume control display
    // Unique to these default controls. Uses borders to create the look of bars.
    updateVolumeDisplays: function(){
      if (!this.volumeDisplays) { return; }
      this.each(this.volumeDisplays, function(dis){
        this.updateVolumeDisplay(dis);
      })
    },
    updateVolumeDisplay: function(display){
      var volNum = Math.ceil(this.volume() * 6);
      this.each(display.children, function(child, num){
        if (num < volNum) {
          _V_.addClass(child, "vjs-volume-level-on");
        } else {
          _V_.removeClass(child, "vjs-volume-level-on");
        }
      })
    }
  }
);
/* Volume Scrubber Behaviors
================================================================================ */
VideoJS.player.newBehavior("volumeScrubber", function(element){
    element.addEventListener("mousedown", this.onVolumeScrubberMouseDown.rEvtContext(this), false);
  },{
    // Adjust the volume when the user drags on the volume control
    onVolumeScrubberMouseDown: function(event, scrubber){
      // event.preventDefault();
      _V_.blockTextSelection();
      this.currentScrubber = scrubber;
      this.setVolumeWithScrubber(event);
      document.addEventListener("mousemove", this.onVolumeScrubberMouseMove.rEvtContext(this), false);
      document.addEventListener("mouseup", this.onVolumeScrubberMouseUp.rEvtContext(this), false);
    },
    onVolumeScrubberMouseMove: function(event){ 
      this.setVolumeWithScrubber(event);
    },
    onVolumeScrubberMouseUp: function(event){
      this.setVolumeWithScrubber(event);
      _V_.unblockTextSelection();
      document.removeEventListener("mousemove", this.onVolumeScrubberMouseMove, false);
      document.removeEventListener("mouseup", this.onVolumeScrubberMouseUp, false);
    },
    setVolumeWithScrubber: function(event){
      var newVol = _V_.getRelativePosition(event.pageX, this.currentScrubber);
      this.volume(newVol);
    }
  }
);
/* Fullscreen Toggle Behaviors
================================================================================ */
VideoJS.player.newBehavior("fullscreenToggle", function(element){
    element.addEventListener("click", this.onFullscreenToggleClick.context(this), false);
  },{
    // When the user clicks on the fullscreen button, update fullscreen setting
    onFullscreenToggleClick: function(event){
      if (!this.videoIsFullScreen) {
        this.fullscreenOn();
      } else {
        this.fullscreenOff();
      }
    },
    // Turn on fullscreen (window) mode
    // Real fullscreen isn't available in browsers quite yet.
    fullscreenOn: function(){
      if (!this.nativeFullscreenOn()) {
        this.videoIsFullScreen = true;
        // Storing original doc overflow value to return to when fullscreen is off
        this.docOrigOverflow = document.documentElement.style.overflow;
        // Add listener for esc key to exit fullscreen
        document.addEventListener("keydown", this.fullscreenOnEscKey.rEvtContext(this), false);
        // Add listener for a window resize
        window.addEventListener("resize", this.fullscreenOnWindowResize.rEvtContext(this), false);
        // Hide any scroll bars
        document.documentElement.style.overflow = 'hidden';
        // Apply fullscreen styles
        _V_.addClass(this.box, "vjs-fullscreen");
        // Resize the box, controller, and poster
        this.positionAll();
      }
    },
    // If available use the native fullscreen
    nativeFullscreenOn: function(){
      if(this.supportsFullScreen()) {
        return this.enterFullScreen();
      } else {
        return false;
      }
    },
    // Turn off fullscreen (window) mode
    fullscreenOff: function(){
      this.videoIsFullScreen = false;
      document.removeEventListener("keydown", this.fullscreenOnEscKey, false);
      window.removeEventListener("resize", this.fullscreenOnWindowResize, false);
      // Unhide scroll bars.
      document.documentElement.style.overflow = this.docOrigOverflow;
      // Remove fullscreen styles
      _V_.removeClass(this.box, "vjs-fullscreen");
      // Resize the box, controller, and poster to original sizes
      this.positionAll();
    },
    fullscreenOnWindowResize: function(event){ // Removeable
      this.positionControlBars();
    },
    // Create listener for esc key while in full screen mode
    fullscreenOnEscKey: function(event){ // Removeable
      if (event.keyCode == 27) {
        this.fullscreenOff();
      }
    }
  }
);
/* Big Play Button Behaviors
================================================================================ */
VideoJS.player.newBehavior("bigPlayButton", function(element){
    if (!this.elements.bigPlayButtons) { 
      this.elements.bigPlayButtons = [];
      this.onPlay(this.bigPlayButtonsOnPlay);
      this.onEnded(this.bigPlayButtonsOnEnded);
    }
    this.elements.bigPlayButtons.push(element);
    this.activateElement(element, "playButton");
  },{
    bigPlayButtonsOnPlay: function(event){ this.hideBigPlayButtons(); },
    bigPlayButtonsOnEnded: function(event){ this.showBigPlayButtons(); },
    showBigPlayButtons: function(){ 
      this.each(this.elements.bigPlayButtons, function(element){
        element.style.display = "block"; 
      });
    },
    hideBigPlayButtons: function(){ 
      this.each(this.elements.bigPlayButtons, function(element){
        element.style.display = "none"; 
      })
    }
  }
);
/* Spinner
================================================================================ */
VideoJS.player.newBehavior("spinner", function(element){
    if (!this.spinners) {
      this.spinners = [];
      this.video.addEventListener("loadeddata", this.spinnersOnVideoLoadedData.context(this), false);
      this.video.addEventListener("loadstart", this.spinnersOnVideoLoadStart.context(this), false);
      this.video.addEventListener("seeking", this.spinnersOnVideoSeeking.context(this), false);
      this.video.addEventListener("seeked", this.spinnersOnVideoSeeked.context(this), false);
      this.video.addEventListener("canplay", this.spinnersOnVideoCanPlay.context(this), false);
      this.video.addEventListener("canplaythrough", this.spinnersOnVideoCanPlayThrough.context(this), false);
      this.video.addEventListener("waiting", this.spinnersOnVideoWaiting.context(this), false);
      this.video.addEventListener("stalled", this.spinnersOnVideoStalled.context(this), false);
      this.video.addEventListener("suspend", this.spinnersOnVideoSuspend.context(this), false);
      this.video.addEventListener("playing", this.spinnersOnVideoPlaying.context(this), false);
      this.video.addEventListener("timeupdate", this.spinnersOnVideoTimeUpdate.context(this), false);
    }
    this.spinners.push(element);
  },{
    showSpinners: function(){
      this.each(this.spinners, function(spinner){
        spinner.style.display = "block";
      });
      clearInterval(this.spinnerInterval);
      this.spinnerInterval = setInterval(this.rotateSpinners.context(this), 100);
    },
    hideSpinners: function(){
      this.each(this.spinners, function(spinner){
        spinner.style.display = "none";
      });
      clearInterval(this.spinnerInterval);
    },
    spinnersRotated: 0,
    rotateSpinners: function(){
      this.each(this.spinners, function(spinner){
        // spinner.style.transform =       'scale(0.5) rotate('+this.spinnersRotated+'deg)';
        spinner.style.WebkitTransform = 'scale(0.5) rotate('+this.spinnersRotated+'deg)';
        spinner.style.MozTransform =    'scale(0.5) rotate('+this.spinnersRotated+'deg)';
      });
      if (this.spinnersRotated == 360) { this.spinnersRotated = 0; }
      this.spinnersRotated += 45;
    },
    spinnersOnVideoLoadedData: function(event){ this.hideSpinners(); },
    spinnersOnVideoLoadStart: function(event){ this.showSpinners(); },
    spinnersOnVideoSeeking: function(event){ /* this.showSpinners(); */ },
    spinnersOnVideoSeeked: function(event){ /* this.hideSpinners(); */ },
    spinnersOnVideoCanPlay: function(event){ /* this.hideSpinners(); */ },
    spinnersOnVideoCanPlayThrough: function(event){ this.hideSpinners(); },
    spinnersOnVideoWaiting: function(event){
      // Safari sometimes triggers waiting inappropriately
      // Like after video has played, any you play again.
      this.showSpinners();
    },
    spinnersOnVideoStalled: function(event){},
    spinnersOnVideoSuspend: function(event){},
    spinnersOnVideoPlaying: function(event){ this.hideSpinners(); },
    spinnersOnVideoTimeUpdate: function(event){
      // Safari sometimes calls waiting and doesn't recover
      if(this.spinner.style.display == "block") { this.hideSpinners(); }
    }
  }
);
/* Subtitles
================================================================================ */
VideoJS.player.newBehavior("subtitlesDisplay", function(element){
    if (!this.elements.subtitlesDisplays) { 
      this.elements.subtitlesDisplays = [];
      this.video.addEventListener('timeupdate', this.subtitlesDisplaysOnVideoTimeUpdate.context(this), false);
    }
    this.elements.subtitlesDisplays.push(element);
  },{
    subtitlesDisplaysOnVideoTimeUpdate: function(){
      // show the subtitles
      if (this.subtitles) {
        // var x = this.currentSubtitlePosition;
        var x = 0;

        while (x<this.subtitles.length && this.video.currentTime>this.subtitles[x].endTime) {
          if (this.subtitles[x].showing) {
            this.subtitles[x].showing = false;
            this.updateSubtitlesDisplays("");
          }
          this.currentSubtitlePosition++;
          x = this.currentSubtitlePosition;
        }

        if (this.currentSubtitlePosition>=this.subtitles.length) { return; }

        if (this.video.currentTime>=this.subtitles[x].startTime && this.video.currentTime<=this.subtitles[x].endTime) {
          this.updateSubtitlesDisplays(this.subtitles[x].text);
          this.subtitles[x].showing = true;
        }
      }
    },
    updateSubtitlesDisplays: function(val){
      this.each(this.elements.subtitlesDisplays, function(disp){
        disp.innerHTML = val;
      });
    }
  }
);
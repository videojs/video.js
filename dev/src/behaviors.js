////////////////////////////////////////////////////////////////////////////////
// Element Behaviors
// Tell elements how to act or react
////////////////////////////////////////////////////////////////////////////////

/* Player Behaviors - How VideoJS reacts to what the video is doing.
================================================================================ */
VideoJS.fn.newBehavior("player", function(player){
    this.addListener("error", this.playerOnVideoError);
    this.addListener("play", this.playerOnVideoPlay);
    this.addListener("play", this.trackCurrentTime);
    this.addListener("pause", this.stopTrackingCurrentTime);
    this.addListener("ended", this.playerOnVideoEnded);
    this.trackBuffered();
    this.addListener("bufferedupdate", this.bufferFull);
  },{
    playerOnVideoError: function(event){
      this.log(event);
      this.log(this.video.error);
    },
    playerOnVideoPlay: function(event){ this.hasPlayed = true; },
    playerOnVideoEnded: function(event){
      if (this.options.loop) {
        this.currentTime(0);
        this.play();
      } else if (this.options.returnToStart) {
        this.currentTime(0);
        this.pause();
      }
    },

    /* Load Tracking -------------------------------------------------------------- */
    // Buffer watching method for load progress.
    // Used for browsers that don't support the progress event
    trackBuffered: function(){
      this.bufferedInterval = setInterval(function(){
        // Don't trigger unless
        if (this.values.bufferEnd < this.buffered().end(0)) {
          this.triggerListeners("bufferedupdate");
        }
      }.context(this), 500);
    },
    stopTrackingBuffered: function(){ clearInterval(this.bufferedInterval); },
    bufferFull: function(){
      if (this.bufferedPercent() == 1) {
        this.stopTrackingBuffered();
      }
    },

    /* Time Tracking -------------------------------------------------------------- */
    trackCurrentTime: function(){
      if (this.currentTimeInterval) { clearInterval(this.currentTimeInterval); }

      this.currentTimeInterval = setInterval(function(){
        this.triggerListeners("timeupdate");
      }.context(this), 100); // 42 = 24 fps

      this.trackingCurrentTime = true;
    },
    // Turn off play progress tracking (when paused or dragging)
    stopTrackingCurrentTime: function(){
      clearInterval(this.currentTimeInterval);
      this.trackingCurrentTime = false;
    }
  }
);
/* Mouse Over Video Reporter Behaviors - i.e. Controls hiding based on mouse location
================================================================================ */
VideoJS.fn.newBehavior("mouseOverVideoReporter", function(element){
    // Listen for the mouse move the video. Used to reveal the controller.
    _V_.addListener(element, "mousemove", this.mouseOverVideoReporterOnMouseMove.context(this));
    // Listen for the mouse moving out of the video. Used to hide the controller.
    _V_.addListener(element, "mouseout", this.mouseOverVideoReporterOnMouseOut.context(this));
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
VideoJS.fn.newBehavior("box", function(element){
    this.positionBox();
    _V_.addClass(element, "vjs-paused");
    this.activateElement(element, "mouseOverVideoReporter");
    this.addListener("play", this.boxOnVideoPlay);
    this.addListener("pause", this.boxOnVideoPause);
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
VideoJS.fn.newBehavior("poster", function(element){
    this.activateElement(element, "mouseOverVideoReporter");
    this.activateElement(element, "playButton");
    this.addListener("play", this.hidePoster);
    this.addListener("ended", this.showPoster);
    this.addListener("resize", this.positionPoster);
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
VideoJS.fn.newBehavior("controlBar", function(element){
    if (!this.controlBars) {
      this.controlBars = [];
      this.addListener("resize", this.positionControlBars);
    }
    this.controlBars.push(element);
    _V_.addListener(element, "mousemove", this.onControlBarsMouseMove.context(this));
    _V_.addListener(element, "mouseout", this.onControlBarsMouseOut.context(this));
  },{
    showControlBars: function(){
      if (!this.options.controlsEnabled) { return; }
      if (!this.options.controlsAtStart && !this.hasPlayed) { return; }
      this.each(this.controlBars, function(bar){
        // bar.style.opacity = 1;
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
          // bar.style.opacity = 0;
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
VideoJS.fn.newBehavior("playToggle", function(element){
    if (!this.elements.playToggles) {
      this.elements.playToggles = [];
      this.addListener("play", this.playTogglesOnPlay);
      this.addListener("pause", this.playTogglesOnPause);
    }
    this.elements.playToggles.push(element);
    _V_.addListener(element, "click", this.onPlayToggleClick.context(this));
  },{
    onPlayToggleClick: function(event){
      if (this.paused()) {
        this.play();
      } else {
        this.pause();
      }
    },
    playTogglesOnPlay: function(event){
      this.each(this.elements.playToggles, function(toggle){
        _V_.removeClass(toggle, "vjs-paused");
        _V_.addClass(toggle, "vjs-playing");
      });
    },
    playTogglesOnPause: function(event){
      this.each(this.elements.playToggles, function(toggle){
        _V_.removeClass(toggle, "vjs-playing");
        _V_.addClass(toggle, "vjs-paused");
      });
    }
  }
);
// Play
VideoJS.fn.newBehavior("playButton", function(element){
    _V_.addListener(element, "click", this.onPlayButtonClick.context(this));
  },{
    onPlayButtonClick: function(event){ this.play(); }
  }
);
// Pause
VideoJS.fn.newBehavior("pauseButton", function(element){
    _V_.addListener(element, "click", this.onPauseButtonClick.context(this));
  },{
    onPauseButtonClick: function(event){ this.pause(); }
  }
);
/* Play Progress Bar Behaviors
================================================================================ */
VideoJS.fn.newBehavior("playProgressBar", function(element){
    if (!this.elements.playProgressBars) {
      this.elements.playProgressBars = [];
      this.addListener("timeupdate", this.updatePlayProgressBars);
    }
    this.elements.playProgressBars.push(element);
  },{
    // Ajust the play progress bar's width based on the current play time
    updatePlayProgressBars: function(newTime){
      var progress = (this.scrubbing) ? this.values.currentTime / this.duration() : this.currentTime() / this.duration();
      if (isNaN(progress)) { progress = 0; }
      this.each(this.elements.playProgressBars, function(bar){
        if (bar.style) { bar.style.width = _V_.round(progress * 100, 2) + "%"; }
      });
    }
  }
);
/* Load Progress Bar Behaviors
================================================================================ */
VideoJS.fn.newBehavior("loadProgressBar", function(element){
    if (!this.elements.loadProgressBars) { this.elements.loadProgressBars = []; }
    this.elements.loadProgressBars.push(element);
    this.addListener("bufferedupdate", this.updateLoadProgressBars);
  },{
    updateLoadProgressBars: function(){
      this.each(this.elements.loadProgressBars, function(bar){
        if (bar.style) { bar.style.width = _V_.round(this.bufferedPercent() * 100, 2) + "%"; }
      });
    }
  }
);

/* Current Time Display Behaviors
================================================================================ */
VideoJS.fn.newBehavior("currentTimeDisplay", function(element){
    if (!this.elements.currentTimeDisplays) {
      this.elements.currentTimeDisplays = [];
      this.addListener("timeupdate", this.updateCurrentTimeDisplays);
    }
    this.elements.currentTimeDisplays.push(element);
  },{
    // Update the displayed time (00:00)
    updateCurrentTimeDisplays: function(newTime){
      // Allows for smooth scrubbing, when player can't keep up.
      var time = (this.scrubbing) ? this.values.currentTime : this.currentTime();
      this.each(this.elements.currentTimeDisplays, function(dis){
        dis.innerHTML = _V_.formatTime(time);
      });
    }
  }
);

/* Duration Display Behaviors
================================================================================ */
VideoJS.fn.newBehavior("durationDisplay", function(element){
    if (!this.elements.durationDisplays) {
      this.elements.durationDisplays = [];
      this.addListener("timeupdate", this.updateDurationDisplays);
    }
    this.elements.durationDisplays.push(element);
  },{
    updateDurationDisplays: function(){
      this.each(this.elements.durationDisplays, function(dis){
        if (this.duration()) { dis.innerHTML = _V_.formatTime(this.duration()); }
      });
    }
  }
);

/* Current Time Scrubber Behaviors
================================================================================ */
VideoJS.fn.newBehavior("currentTimeScrubber", function(element){
    _V_.addListener(element, "mousedown", this.onCurrentTimeScrubberMouseDown.rEvtContext(this));
  },{
    // Adjust the play position when the user drags on the progress bar
    onCurrentTimeScrubberMouseDown: function(event, scrubber){
      event.preventDefault();
      this.currentScrubber = scrubber;

      this.stopTrackingCurrentTime(); // Allows for smooth scrubbing
      this.scrubbing = true;

      this.videoWasPlaying = !this.paused();
      this.pause();

      _V_.blockTextSelection();
      this.setCurrentTimeWithScrubber(event);
      _V_.addListener(document, "mousemove", this.onCurrentTimeScrubberMouseMove.rEvtContext(this));
      _V_.addListener(document, "mouseup", this.onCurrentTimeScrubberMouseUp.rEvtContext(this));
    },
    onCurrentTimeScrubberMouseMove: function(event){ // Removeable
      this.setCurrentTimeWithScrubber(event);
    },
    onCurrentTimeScrubberMouseUp: function(event){ // Removeable
      _V_.unblockTextSelection();
      document.removeEventListener("mousemove", this.onCurrentTimeScrubberMouseMove, false);
      document.removeEventListener("mouseup", this.onCurrentTimeScrubberMouseUp, false);
      this.scrubbing = false;
      if (this.videoWasPlaying) {
        this.play();
        this.trackCurrentTime();
      }
    },
    setCurrentTimeWithScrubber: function(event){
      var newProgress = _V_.getRelativePosition(event.pageX, this.currentScrubber);
      var newTime = newProgress * this.duration();
      // Don't let video end while scrubbing.
      if (newTime == this.duration()) { newTime = newTime - 0.1; }
      this.currentTime(newTime);
      this.triggerListeners("timeupdate");
    }
  }
);
/* Volume Display Behaviors
================================================================================ */
VideoJS.fn.newBehavior("volumeDisplay", function(element){
    if (!this.elements.volumeDisplays) {
      this.elements.volumeDisplays = [];
      this.addListener("volumechange", this.updateVolumeDisplays);
    }
    this.elements.volumeDisplays.push(element);
    this.updateVolumeDisplay(element); // Set the display to the initial volume
  },{
    // Update the volume control display
    // Unique to these default controls. Uses borders to create the look of bars.
    updateVolumeDisplays: function(){
      if (!this.elements.volumeDisplays) { return; }
      this.each(this.elements.volumeDisplays, function(dis){
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
/* Volume Scrubber Behaviors
================================================================================ */
VideoJS.fn.newBehavior("volumeScrubber", function(element){
    _V_.addListener(element, "mousedown", this.onVolumeScrubberMouseDown.rEvtContext(this));
  },{
    // Adjust the volume when the user drags on the volume control
    onVolumeScrubberMouseDown: function(event, scrubber){
      // event.preventDefault();
      _V_.blockTextSelection();
      this.currentScrubber = scrubber;
      this.setVolumeWithScrubber(event);
      _V_.addListener(document, "mousemove", this.onVolumeScrubberMouseMove.rEvtContext(this));
      _V_.addListener(document, "mouseup", this.onVolumeScrubberMouseUp.rEvtContext(this));
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
VideoJS.fn.newBehavior("fullscreenToggle", function(element){
    _V_.addListener(element, "click", this.onFullscreenToggleClick.context(this));
  },{
    // When the user clicks on the fullscreen button, update fullscreen setting
    onFullscreenToggleClick: function(event){
      if (!this.videoIsFullScreen) {
        this.enterFullScreen();
      } else {
        this.exitFullScreen();
      }
    },

    fullscreenOnWindowResize: function(event){ // Removeable
      this.positionControlBars();
    },
    // Create listener for esc key while in full screen mode
    fullscreenOnEscKey: function(event){ // Removeable
      if (event.keyCode == 27) {
        this.exitFullScreen();
      }
    }
  }
);
/* Big Play Button Behaviors
================================================================================ */
VideoJS.fn.newBehavior("bigPlayButton", function(element){
    if (!this.elements.bigPlayButtons) {
      this.elements.bigPlayButtons = [];
      this.addListener("play", this.hideBigPlayButtons);
      this.addListener("ended", this.showBigPlayButtons);
    }
    this.elements.bigPlayButtons.push(element);
    this.activateElement(element, "playButton");
  },{
    showBigPlayButtons: function(){
      if (!this.options.controlsEnabled) { return; }
      this.each(this.elements.bigPlayButtons, function(element){
        element.style.display = "block";
      });
    },
    hideBigPlayButtons: function(){
      this.each(this.elements.bigPlayButtons, function(element){
        element.style.display = "none";
      });
    }
  }
);
/* Spinner
================================================================================ */
VideoJS.fn.newBehavior("spinner", function(element){
    if (!this.spinners) {
      this.spinners = [];
      this.spinnersRotated = 0;
      _V_.addListener(this.video, "loadeddata", this.spinnersOnVideoLoadedData.context(this));
      _V_.addListener(this.video, "loadstart", this.spinnersOnVideoLoadStart.context(this));
      _V_.addListener(this.video, "seeking", this.spinnersOnVideoSeeking.context(this));
      _V_.addListener(this.video, "seeked", this.spinnersOnVideoSeeked.context(this));
      _V_.addListener(this.video, "canplay", this.spinnersOnVideoCanPlay.context(this));
      _V_.addListener(this.video, "canplaythrough", this.spinnersOnVideoCanPlayThrough.context(this));
      _V_.addListener(this.video, "waiting", this.spinnersOnVideoWaiting.context(this));
      _V_.addListener(this.video, "stalled", this.spinnersOnVideoStalled.context(this));
      _V_.addListener(this.video, "suspend", this.spinnersOnVideoSuspend.context(this));
      _V_.addListener(this.video, "playing", this.spinnersOnVideoPlaying.context(this));
      _V_.addListener(this.video, "timeupdate", this.spinnersOnVideoTimeUpdate.context(this));
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
      // Like after video has played, and you play again.
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
VideoJS.fn.newBehavior("subtitlesDisplay", function(element){
    if (!this.elements.subtitleDisplays) {
      this.elements.subtitleDisplays = [];
      this.addListener("timeupdate", this.subtitleDisplaysOnVideoTimeUpdate);
      this.addListener("ended", function() { this.lastSubtitleIndex = 0; }.context(this));
    }
    this.elements.subtitleDisplays.push(element);
  },{
    subtitleDisplaysOnVideoTimeUpdate: function(){
      // Assuming all subtitles are in order by time, and do not overlap
      if (this.subtitles) {
        var time = this.currentTime();
        // If current subtitle should stay showing, don't do anything. Otherwise, find new subtitle.
        if (!this.currentSubtitle || this.currentSubtitle.start >= time || this.currentSubtitle.end < time) {
          var newSubIndex = false,
              // Loop in reverse if lastSubtitle is after current time (optimization)
              // Meaning the user is scrubbing in reverse or rewinding
              reverse = (this.subtitles[this.lastSubtitleIndex].start > time),
              // If reverse, step back 1 becase we know it's not the lastSubtitle
              i = this.lastSubtitleIndex - (reverse) ? 1 : 0;
          while (true) { // Loop until broken
            if (reverse) { // Looping in reverse
              // Stop if no more, or this subtitle ends before the current time (no earlier subtitles should apply)
              if (i < 0 || this.subtitles[i].end < time) { break; }
              // End is greater than time, so if start is less, show this subtitle
              if (this.subtitles[i].start < time) {
                newSubIndex = i;
                break;
              }
              i--;
            } else { // Looping forward
              // Stop if no more, or this subtitle starts after time (no later subtitles should apply)
              if (i >= this.subtitles.length || this.subtitles[i].start > time) { break; }
              // Start is less than time, so if end is later, show this subtitle
              if (this.subtitles[i].end > time) {
                newSubIndex = i;
                break;
              }
              i++;
            }
          }

          // Set or clear current subtitle
          if (newSubIndex !== false) {
            this.currentSubtitle = this.subtitles[newSubIndex];
            this.lastSubtitleIndex = newSubIndex;
            this.updateSubtitleDisplays(this.currentSubtitle.text);
          } else if (this.currentSubtitle) {
            this.currentSubtitle = false;
            this.updateSubtitleDisplays("");
          }
        }
      }
    },
    updateSubtitleDisplays: function(val){
      this.each(this.elements.subtitleDisplays, function(disp){
        disp.innerHTML = val;
      });
    }
  }
);


////////////////////////////////////////////////////////////////////////////////
// Element Behaviors
// Tell elements how to act or react
////////////////////////////////////////////////////////////////////////////////

/* Video Behaviors
================================================================================ */
VideoJS.player.newBehavior("video", function(element){
    element.addEventListener('error',this.onVideoError.context(this),false);
    // Listen for when the video is played
    element.addEventListener("play", this.onVideoPlay.context(this), false);
    // Listen for when the video is paused
    element.addEventListener("pause", this.onVideoPause.context(this), false);
    // Listen for when the video ends
    element.addEventListener("ended", this.onVideoEnded.context(this), false);
    // Listen for a volume change
    element.addEventListener('volumechange',this.onVideoVolumeChange.context(this),false);
    // Listen for Video Load Progress (currently does not if html file is local)
    element.addEventListener('progress', this.onVideoProgress.context(this), false);
    // Set interval for load progress using buffer watching method
    this.trackBuffered();
    // Make a click on th video act as a play button
    this.activateElement(element, "playToggle");
  },{
    onVideoError: function(event){ this.log(this.video.error); },
    onVideoPlay: function(event){
      this.hasPlayed = true;
      _V_.removeClass(this.box, "vjs-paused");
      _V_.addClass(this.box, "vjs-playing");
      this.trackCurrentTime();
    },
    onVideoPause: function(event){
      _V_.removeClass(this.box, "vjs-playing");
      _V_.addClass(this.box, "vjs-paused");
      this.stopTrackingCurrentTime();
    },
    onVideoEnded: function(event){
      this.currentTime(0);
      this.pause();
    },
    onVideoVolumeChange: function(event){ this.updateVolumeDisplays(); },

    /* Load Tracking -------------------------------------------------------------- */
    // When the video's load progress is updated
    // Does not work in all browsers (Safari/Chrome 5)
    onVideoProgress: function(event){
      if(event.total > 0) {
        this.loaded(event.loaded / event.total);
      }
    },
    // Buffer watching method for load progress.
    // Used for browsers that don't support the progress event
    trackBuffered: function(){
      this.bufferedInterval = setInterval(this.updateBufferedTotal.context(this), 33);
    },
    updateBufferedTotal: function(){
      if (this.video.buffered) {
        if (this.video.buffered.length >= 1 && this.duration() > 0) {
          this.loaded(this.video.buffered.end(0) / this.duration());
          if (this.video.buffered.end(0) === this.duration()) {
            this.stopTrackingBuffered();
          }
        }
      } else {
        this.stopTrackingBuffered();
      }
    },
    stopTrackingBuffered: function(){ clearInterval(this.bufferedInterval); },

    /* Time Tracking -------------------------------------------------------------- */
    trackCurrentTime: function(){
      if (this.currentTimeInterval) { clearInterval(this.currentTimeInterval); }
      this.currentTimeInterval = setInterval(this.onCurrentTimeUpdate.context(this), 33);
    },
    // Turn off play progress tracking (when paused or dragging)
    stopTrackingCurrentTime: function(){ clearInterval(this.currentTimeInterval); },
    onCurrentTimeUpdate: function(){
      this.updatePlayProgress();
      this.updateCurrentTimeDisplays();
      this.updateDurationDisplays();
    },
    // Play progress
    updatePlayProgress: function(){
      if (this.duration()) {
        this.playProgress(this.currentTime() / this.duration());
      }
    },
    onPlayProgressUpdate: function(){
      this.updatePlayProgressBars();
    }
  }
);
/* Mouse Over Video Reporter Behaviors
================================================================================ */
VideoJS.player.newBehavior("mouseOverVideoReporter", function(element){
    // Listen for the mouse move the video. Used to reveal the controller.
    element.addEventListener("mousemove", this.onVideoMouseMove.context(this), false);
    // Listen for the mouse moving out of the video. Used to hide the controller.
    element.addEventListener("mouseout", this.onVideoMouseOut.context(this), false);
  },{
    onVideoMouseMove: function(){
      this.showControlBars();
      clearInterval(this.mouseMoveTimeout);
      this.mouseMoveTimeout = setTimeout(this.hideControlBars.context(this), 4000);
    },
    onVideoMouseOut: function(event){
      // Prevent flicker by making sure mouse hasn't left the video
      var parent = event.relatedTarget;
      while (parent && parent !== this.video && parent !== this.controls) {
        parent = parent.parentNode;
      }
      if (parent !== this.video && parent !== this.controls) {
        this.hideControlBars();
      }
    }
  }
);
/* Poster Image Overlay
================================================================================ */
VideoJS.player.newBehavior("poster", function(element){
    this.activateElement(element, "mouseOverVideoReporter");
    this.activateElement(element, "playButton");
    this.video.addEventListener("play", this.posterOnPlay.context(this), false);
    this.video.addEventListener("ended", this.posterOnEnded.context(this), false);
  },{
    posterOnEnded: function(){ this.showPoster(); },
    posterOnPlay: function(){ this.hidePoster(); },
    showPoster: function(){
      if (!this.poster) { return; }
      this.poster.style.display = "block";
      this.positionPoster();
    },
    positionPoster: function(){
      // Only if the poster is visible
      if (!this.poster || this.poster.style.display == 'none') { return; }
      this.poster.style.height = this.video.offsetHeight + "px"; // Need incase controlsBelow
      this.poster.style.width = this.video.offsetWidth + "px"; // Could probably do 100% of box
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
    element.addEventListener("mousemove", this.onControlBarMouseMove.context(this), false);
    element.addEventListener("mouseout", this.onControlBarMouseOut.context(this), false);
    if (!this.controlBars) { this.controlBars = []; }
    this.controlBars.push(element);
  },{
    showControlBars: function(){
      if (!this.options.showControlsAtStart && !this.hasPlayed) { return; }
      this.controls.style.display = "block";
      this.positionControlBars();
    },
    // Place controller relative to the video's position
    positionControlBars: function(){
      // Make sure the controls are visible
      // if (this.controls.style.display == 'none') { return; }
      this.updatePlayProgressBars();
      this.updateLoadProgress();
    },
    hideControlBars: function(){
      if (this.options.controlsHiding && !this.mouseIsOverControls) { this.controls.style.display = "none"; }
    },
    // Block controls from hiding when mouse is over them.
    onControlBarMouseMove: function(){ this.mouseIsOverControls = true; },
    onControlBarMouseOut: function(event){ 
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
      if (this.video.paused) {
        this.video.play();
      } else {
        this.video.pause();
      }
    }
  }
);
// Play
VideoJS.player.newBehavior("playButton", function(element){
    element.addEventListener("click", this.onPlayButtonClick.context(this), false);
  },{
    onPlayButtonClick: function(event){ this.video.play(); }
  }
);
// Pause
VideoJS.player.newBehavior("pauseButton", function(element){
    element.addEventListener("click", this.onPauseButtonClick.context(this), false);
  },{
    onPauseButtonClick: function(event){ this.video.pause(); }
  }
);
/* Play Progress Bar Behaviors
================================================================================ */
VideoJS.player.newBehavior("playProgressBar", function(element){
    if (!this.playProgressBars) { this.playProgressBars = []; }
    this.playProgressBars.push(element);
  },{
    // Ajust the play progress bar's width based on the current play time
    updatePlayProgressBars: function(){
      this.each(this.playProgressBars, function(bar){
        if (bar.style) { bar.style.width = _V_.round(this.playProgress() * 100, 2) + "%"; }
      });
    }
  }
);
/* Load Progress Bar Behaviors
================================================================================ */
VideoJS.player.newBehavior("loadProgressBar", function(element){
    if (!this.loadProgressBars) { this.loadProgressBars = []; }
    this.loadProgressBars.push(element);
  },{
    updateLoadProgress: function(){
      this.each(this.loadProgressBars, function(bar){
        if (bar.style) { bar.style.width = _V_.round(this.loaded() * 100, 2) + "%"; }
      });
    }
  }
);

/* Current Time Display Behaviors
================================================================================ */
VideoJS.player.newBehavior("currentTimeDisplay", function(element){
    if (!this.currentTimeDisplays) { this.currentTimeDisplays = []; }
    this.currentTimeDisplays.push(element);
  },{
    // Update the displayed time (00:00)
    updateCurrentTimeDisplays: function(){
      if (!this.currentTimeDisplays) { return; }
      this.each(this.currentTimeDisplays, function(dis){
        dis.innerHTML = _V_.formatTime(this.video.currentTime);
      });
    }
  }
);

/* Duration Display Behaviors
================================================================================ */
VideoJS.player.newBehavior("durationDisplay", function(element){
    if (!this.durationDisplays) { this.durationDisplays = []; }
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

      this.stopTrackingCurrentTime();

      this.videoWasPlaying = !this.video.paused;
      this.video.pause();

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
        this.video.play();
        this.trackCurrentTime();
      }
    },
    setCurrentTimeWithScrubber: function(event){
      var newProgress = _V_.getRelativePosition(event.pageX, this.currentScrubber)
      this.currentTime(newProgress * this.duration());
    }
  }
);
/* Volume Display Behaviors
================================================================================ */
VideoJS.player.newBehavior("volumeDisplay", function(element){
    if (!this.volumeDisplays) { this.volumeDisplays = []; }
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
      var volNum = Math.ceil(this.video.volume * 6);
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
      event.preventDefault();
      this.currentScrubber = scrubber;
      _V_.blockTextSelection();
      this.setVolumeWithScrubber(event);
      document.addEventListener("mousemove", this.onVolumeScrubberMouseMove.rEvtContext(this), false);
      document.addEventListener("mouseup", this.onVolumeScrubberMouseUp.rEvtContext(this), false);
    },
    onVolumeScrubberMouseMove: function(event){ this.setVolumeWithScrubber(event); },
    onVolumeScrubberMouseUp: function(event){
      _V_.unblockTextSelection();
      document.removeEventListener("mousemove", this.onVolumeScrubberMouseMove, false);
      document.removeEventListener("mouseup", this.onVolumeScrubberMouseUp, false);
      this.setVolumeWithScrubber(event);
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
      if(typeof this.video.webkitEnterFullScreen == 'function') {
        // Seems to be broken in Chromium/Chrome
        if (!navigator.userAgent.match("Chrome")) {
          try {
            this.video.webkitEnterFullScreen();
          } catch (e) {
            if (e.code == 11) { this.warning(VideoJS.warnings.videoNotReady); }
          }
          return true;
        }
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
    this.activateElement(element, "playButton");
    if (!this.elements.bigPlayButtons) { 
      this.elements.bigPlayButtons = [];
      this.video.addEventListener("play", this.bigPlayButtonsOnPlay.context(this), false);
      this.video.addEventListener("ended", this.bigPlayButtonsOnEnded.context(this), false);
    }
    this.elements.bigPlayButtons.push(element);
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
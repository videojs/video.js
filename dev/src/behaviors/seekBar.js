/* Seek Bar Behaviors (Current Time Scrubber)
================================================================================ */
VideoJS.fn.newBehavior("seekBar",
  function(element){
    if (!this.bels.seekBars) {
      this.bels.seekBars = [];
      this.addEvent("timeupdate", this.updateSeekBars);
    }
    this.bels.seekBars.push(element);

    // Get and store related child objects (progress bar & handle)
    var data = _V_.getData(element);
    this.each(element.childNodes, function(c){
      if (c.className) {
        if (c.className.indexOf("seek-handle") != -1) {
          data.seekHandle = c;
        } else if (c.className.indexOf("play-progress") != -1) {
          data.playProgress = c;
        }
      }
    });

    // Binding with element as 'this' so the progress holder element can be retrieved in IE.
    // IE doesn't support the currentTarget event attr.
    var player = this;
    _V_.addEvent(element, "mousedown", _V_.proxy(element, function(event){
      player.onSeekBarMouseDown(event, this);
    }));
    _V_.addEvent(element, "focus", _V_.proxy(this, this.onSeekBarFocus));
    _V_.addEvent(element, "blur", _V_.proxy(this, this.onSeekBarBlur));
  },
  function(){},
  {
    // Adjust the play position when the user drags on the progress bar
    onSeekBarMouseDown: function(event, currentTarget){
      event.preventDefault();
      _V_.blockTextSelection();

      this.currSeekBar = currentTarget;
      this.currHandle = _V_.getData(currentTarget).seekHandle || false;

      this.scrubbing = true;

      this.videoWasPlaying = !this.paused();
      this.pause();

      this.setCurrentTimeWithScrubber(event);
      _V_.addEvent(document, "mousemove", _V_.proxy(this, this.onSeekBarMouseMove));
      _V_.addEvent(document, "mouseup", _V_.proxy(this, this.onSeekBarMouseUp));
    },
    onSeekBarMouseMove: function(event){ // Removeable
      this.setCurrentTimeWithScrubber(event);
    },
    onSeekBarMouseUp: function(event){ // Removeable
      _V_.unblockTextSelection();
      _V_.removeEvent(document, "mousemove", this.onSeekBarMouseMove, false);
      _V_.removeEvent(document, "mouseup", this.onSeekBarMouseUp, false);
      this.scrubbing = false;
      if (this.videoWasPlaying) {
        this.play();
      }
    },
    setCurrentTimeWithScrubber: function(event){
      var bar = this.currSeekBar,
          barX = _V_.findPosX(bar),
          barW = bar.offsetWidth,
          handle = this.currHandle,
          handleW = (handle) ? handle.offsetWidth : 0;
          
          // Adjusted X and Width, so handle doesn't go outside the bar
          barAX = barX + (handleW / 2),
          barAW = barW - handleW,
          // Percent that the click is through the adjusted area
          percent = Math.max(0, Math.min(1, (event.pageX - barAX) / barAW)),
          // Percent translated to pixels
          percentPix = percent * barAW,
          // Percent translated to seconds
          newTime = percent * this.duration();

      // Don't let video end while scrubbing.
      if (newTime == this.duration()) { newTime = newTime - 0.1; }

      // Set new time (tell player to seek to new time)
      this.currentTime(newTime);
    },
    getSeekBarAdjustedWidth: function(bar, handle){
      var bar = this.currSeekBar,
          barX = _V_.findPosX(bar),
          barW = bar.offsetWidth,
          handle = this.currHandle,
          handleW = (handle) ? handle.offsetWidth : 0;

          // Adjusted X and Width, so handle doesn't go outside the bar
          barAX = barX + (handleW / 2),
          barAW = barW - handleW;
    },
    updateSeekBars: function(){
      // If scrubbing, use the cached currentTime value for speed
      var progress = /* (this.scrubbing) ? this.scrubTime / this.duration() : */ this.currentTime() / this.duration();
      // Protect against no duration and other division issues
      if (isNaN(progress)) { progress = 0; }
      
      this.each(this.bels.seekBars, function(bar){
        var barData = _V_.getData(bar),
            barX = _V_.findPosX(bar),
            barW = bar.offsetWidth,
            handle = barData.seekHandle,
            progBar = barData.playProgress,
            handleW = (handle) ? handle.offsetWidth : 0;

            // Adjusted X and Width, so handle doesn't go outside the bar
            barAX = barX + (handleW / 2),
            barAW = barW - handleW;
            // Percent that the click is through the adjusted area
            // percent = Math.max(0, Math.min(1, (event.pageX - barAX) / barAW)),
            // Percent translated to pixels
            // percentPix = percent * barAW,
            // Percent translated to seconds
            // newTime = percent * this.duration();
        
            
        progBarProgress = _V_.round(progress * barAW + handleW / 2) + "px";
        if (progBar && progBar.style) { progBar.style.width = progBarProgress; }
        
        handle.style.left = _V_.round(progress * barAW)+"px";
      });
      
      
      // Update bar length
      // this.each(this.bels.playProgressBars, function(bar){
      //   if (bar.style) { bar.style.width = _V_.round(progress * 100, 2) + "%"; }
      // });

      // Move Handle
    },
    onSeekBarFocus: function(event){
      _V_.addEvent(document, "keyup", _V_.proxy(this, this.onSeekBarKey));
    },
    onSeekBarKey: function(event){
      if (event.which == 37) {
        event.preventDefault();
        this.currentTime(this.currentTime() - 1);
      } else if (event.which == 39) {
        event.preventDefault();
        this.currentTime(this.currentTime() + 1);
      }
    },
    onSeekBarBlur: function(event){
       _V_.removeEvent(document, "keyup", _V_.proxy(this, this.onSeekBarKey));
    }
  }
);
/* Seek Handle Behaviors
================================================================================ */
VideoJS.fn.newBehavior("seekHandle",
  function(element){
    if (!this.bels.seekHandles) { this.bels.seekHandles = []; }
    this.bels.seekHandles.push(element);

    // Store references between seekbar and seekhandle
    _V_.getData(element).seekBar = element.parentNode;
    _V_.getData(element.parentNode).seekHandle = element;
  },
  function(){},
  {}
);

/* Play Progress Bar Behaviors
================================================================================ */
VideoJS.fn.newBehavior("playProgressBar",
  function(element){
    if (!this.bels.playProgressBars) {
      this.bels.playProgressBars = [];
      this.addEvent("timeupdate", this.updatePlayProgressBars);
    }
    this.bels.playProgressBars.push(element);
  },
  function(){
    // Remove
  },
  {
    // Ajust the play progress bar's width based on the current play time
    updatePlayProgressBars: function(){
      // If scrubbing, use the cached currentTime value for speed
      var progress = (this.scrubbing) ? this.values.currentTime / this.duration() : this.currentTime() / this.duration();
      // Protect against no duration and other division issues
      if (isNaN(progress)) { progress = 0; }
      // Update bar length
      this.each(this.bels.playProgressBars, function(bar){
        if (bar.style) { bar.style.width = _V_.round(progress * 100, 2) + "%"; }
      });
    }
  }
);

/* Load Progress Bar Behaviors
================================================================================ */
VideoJS.fn.newBehavior("loadProgressBar",
  function(element){
    if (!this.bels.loadProgressBars) { this.bels.loadProgressBars = []; }
    this.bels.loadProgressBars.push(element);
    this.addEvent("progress", this.updateLoadProgressBars);
  },
  function(){},
  {
    updateLoadProgressBars: function(event){
      // log("updating progress bars", this.bufferedPercent());
      this.each(this.bels.loadProgressBars, function(bar){
        if (bar.style) { bar.style.width = _V_.round(this.bufferedPercent() * 100, 2) + "%"; }
      });
    }
  }
);

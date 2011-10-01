/* Volume Behaviors
================================================================================ */
/* Seek Bar Behaviors (Current Time Scrubber)
================================================================================ */
VideoJS.fn.newBehavior("volumeBar",
  function(element){
    if (!this.bels.volumeBars) {
      this.bels.volumeBars = [];
      this.addEvent("volumechange", this.updateVolumeBars);
    }
    this.bels.volumeBars.push(element);

    // Get and store related child objects (level & handle)
    var data = _V_.getData(element);
    this.each(element.childNodes, function(c){
      if (c.className) {
        if (c.className.indexOf("volume-handle") != -1) {
          data.volumeHandle = c;
        } else if (c.className.indexOf("volume-level") != -1) {
          data.volumeLevel = c;
        }
      }
    });

    // Binding with element as 'this' so the holder element can be retrieved in IE.
    // IE doesn't support the currentTarget event attr.
    var player = this;
    _V_.addEvent(element, "mousedown", _V_.proxy(element, function(event){
      player.onVolumeBarMouseDown(event, this);
    }));
    // _V_.addEvent(element, "focus", _V_.proxy(this, this.onVolumeBarFocus));
    // _V_.addEvent(element, "blur", _V_.proxy(this, this.onVolumeBarBlur));
  },
  function(){},
  {
    // Adjust the play position when the user drags on the progress bar
    onVolumeBarMouseDown: function(event, currentTarget){
      event.preventDefault();
      _V_.blockTextSelection();

      this.currVolumeBar = currentTarget;
      this.currHandle = _V_.getData(currentTarget).volumeHandle || false;

      this.setVolumeWithSlider(event);
      _V_.addEvent(document, "mousemove", _V_.proxy(this, this.onVolumeBarMouseMove));
      _V_.addEvent(document, "mouseup", _V_.proxy(this, this.onVolumeBarMouseUp));
    },
    onVolumeBarMouseMove: function(event){ // Removeable
      this.setVolumeWithSlider(event);
    },
    onVolumeBarMouseUp: function(event){ // Removeable
      _V_.unblockTextSelection();
      _V_.removeEvent(document, "mousemove", this.onVolumeBarMouseMove, false);
      _V_.removeEvent(document, "mouseup", this.onVolumeBarMouseUp, false);
    },
    setVolumeWithSlider: function(event){
      var bar = this.currVolumeBar,
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

      this.volume(percent);
    },
    updateVolumeBars: function(){
      var vol = this.volume();
      this.each(this.bels.volumeBars, function(bar){
        var barData = _V_.getData(bar),
            barX = _V_.findPosX(bar),
            barW = bar.offsetWidth,
            handle = barData.volumeHandle,
            progBar = barData.volumeLevel,
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

        progBarProgress = _V_.round(vol * barAW + handleW / 2) + "px";
        if (progBar && progBar.style) { progBar.style.width = progBarProgress; }
        
        handle.style.left = _V_.round(vol * barAW)+"px";
      });
      
      
      // Update bar length
      // this.each(this.bels.playProgressBars, function(bar){
      //   if (bar.style) { bar.style.width = _V_.round(progress * 100, 2) + "%"; }
      // });

      // Move Handle
    }// ,
    //     onVolumeBarFocus: function(event){
    //       _V_.addEvent(document, "keyup", _V_.proxy(this, this.onVolumeBarKey));
    //     },
    //     onVolumeBarKey: function(event){
    //       if (event.which == 37) {
    //         event.preventDefault();
    //         this.currentTime(this.currentTime() - 1);
    //       } else if (event.which == 39) {
    //         event.preventDefault();
    //         this.currentTime(this.currentTime() + 1);
    //       }
    //     },
    //     onVolumeBarBlur: function(event){
    //        _V_.removeEvent(document, "keyup", _V_.proxy(this, this.onVolumeBarKey));
    //     }
  }
);

/* Mute Toggle
================================================================================ */
VideoJS.fn.newBehavior("muteToggle", function(element){
    if (!this.bels.muteToggles) {
      this.bels.muteToggles = [];
      this.addEvent("volumechange", this.muteTogglesOnVolumeChange);
    }
    this.bels.muteToggles.push(element);
    _V_.addEvent(element, "click", _V_.proxy(this, this.onMuteToggleClick));
    // _V_.addEvent(element, "focus", _V_.proxy(this, this.onMuteToggleFocus));
    // _V_.addEvent(element, "blur", _V_.proxy(this, this.onMuteToggleBlur));
  },
  function(){},
  {
    onMuteToggleClick: function(event){
      this.muted( this.muted() ? false : true );
    },
    muteTogglesOnVolumeChange: function(event){
      var vol = this.volume(),
          level = 3;

      if (vol == 0 || this.muted()) {
        level = 0;
      } else if (vol < 0.33) {
        level = 1;
      } else if (vol < 0.67) {
        level = 2;
      }

      this.each(this.bels.muteToggles, function(toggle){
        /* TODO improve muted icon classes */
        _V_.each([0,1,2,3], function(i){
          _V_.removeClass(toggle, "vjs-vol-"+i);
        });
        _V_.addClass(toggle, "vjs-vol-"+level);
      });
    }//,
    // onMuteToggleFocus: function(event){
    //   _V_.addEvent(document, "keyup", _V_.proxy(this, this.onMuteToggleKey));
    // },
    // onMuteToggleKey: function(event){
    //   if (event.which == 32 || event.which == 13) {
    //     event.preventDefault();
    //     this.onMuteToggleClick();
    //   }
    // },
    // onMuteToggleBlur: function(event){
    //    _V_.removeEvent(document, "keyup", _V_.proxy(this, this.onMuteToggleKey));
    // }
  }
);

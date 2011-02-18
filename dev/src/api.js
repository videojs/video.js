/* Player API
================================================================================ */
VideoJS.fn.extend({

  /* Listener types: play, pause, timeupdate, bufferedupdate, ended, volumechange, error */
  addListener: function(type, fn){
    if (!this.listeners[type]) { this.listeners[type] = []; }
    this.listeners[type].push(fn);
  },

  triggerListeners: function(type, e){
    this.each(this.listeners[type], function(listener){
      listener.call(this, e);
    });
  },

  removeListener: function(type, fn){
    var listeners = this.listeners[type];
    if (!listeners) { return; }
    for (var i=0; i<listeners.length; i++) {
      if (listeners[i] == fn) {
        listeners.splice(i--, 1);
      }
    }
  },

  play: function(){ this.api.play.apply(this); return this; },
  pause: function(){ this.api.pause.apply(this); return this; },
  paused: function(){ return this.api.paused.apply(this); },

  currentTime: function(seconds){
    if (seconds !== undefined) {
      this.values.currentTime = seconds; // Cache the last set value for smoother scrubbing.
      this.api.setCurrentTime.call(this, seconds);
      return this;
    }
    return this.api.currentTime.apply(this);
  },

  duration: function(){ return this.api.duration.apply(this); },

  buffered: function(){
    var buffered = this.api.buffered.apply(this),
        start = 0, end = this.values.bufferEnd = this.values.bufferEnd || 0,
        timeRange;

    if (buffered && buffered.length > 0 && buffered.end(0) > end) {
      end = buffered.end(0);
      // Storing values allows them be overridden by setBufferedFromProgress
      this.values.bufferEnd = end;
    }

    return this.createTimeRange(start, end);
  },
  // Mimic HTML5 TimeRange Spec.
  createTimeRange: function(start, end){
    return {
      length: 1,
      start: function() { return start; },
      end: function() { return end; }
    };
  },
  // Calculates amount of buffer is full
  bufferedPercent: function(){ return (this.duration()) ? this.buffered().end(0) / this.duration() : 0; },

  volume: function(percentAsDecimal){
    if (percentAsDecimal !== undefined) {
      var vol = Math.max(0, Math.min(1, parseFloat(percentAsDecimal))); // Force value to between 0 and 1
      this.values.volume = vol;
      this.api.setVolume.call(this, vol);
      this.setLocalStorage("volume", vol);
      return this;
    }
    // if (this.values.volume) { return this.values.volume; }
    return this.api.volume.call(this);
  },

  width: function(width, skipListeners){
    if (width !== undefined) {
      this.element.width = width; // Not using style so it can be overridden on fullscreen.
      this.box.style.width = width+"px";
      if (!skipListeners) { this.triggerListeners("resize"); }
      return this;
    }
    return parseInt(this.element.getAttribute("width"));
    // return this.element.offsetWidth;
  },
  height: function(height){
    if (height !== undefined) {
      this.element.height = height;
      this.box.style.height = height+"px";
      this.triggerListeners("resize");
      return this;
    }
    return parseInt(this.element.getAttribute("height"));
    // return this.element.offsetHeight;
  },
  size: function(width, height){
    // Skip resize listeners on width for optimization
    return this.width(width, true).height(height);
  },

  supportsFullScreen: function(){ return this.api.supportsFullScreen.call(this); },

  // Turn on fullscreen (or window) mode
  enterFullScreen: function(){
    if (this.supportsFullScreen()) {
      this.api.enterFullScreen.call(this);
    } else {
      this.enterFullWindow();
    }
    this.triggerListeners("enterFullScreen");
    return this;
  },

  exitFullScreen: function(){
    if (!this.supportsFullScreen()) {
      this.exitFullWindow();
    }
    this.triggerListeners("exitFullScreen");
    // Otherwise Shouldn't be called since native fullscreen uses own controls.
    return this;
  },

  enterFullWindow: function(){
    this.videoIsFullScreen = true;
    // Storing original doc overflow value to return to when fullscreen is off
    this.docOrigOverflow = document.documentElement.style.overflow;
    // Add listener for esc key to exit fullscreen
    _V_.addListener(document, "keydown", this.fullscreenOnEscKey.rEvtContext(this));
    // Add listener for a window resize
    _V_.addListener(window, "resize", this.fullscreenOnWindowResize.rEvtContext(this));
    // Hide any scroll bars
    document.documentElement.style.overflow = 'hidden';
    // Apply fullscreen styles
    _V_.addClass(this.box, "vjs-fullscreen");
    // Resize the box, controller, and poster
    this.positionAll();
    this.triggerListeners("enterFullWindow");
  },

  exitFullWindow: function(){
    this.videoIsFullScreen = false;
    document.removeEventListener("keydown", this.fullscreenOnEscKey, false);
    window.removeEventListener("resize", this.fullscreenOnWindowResize, false);
    // Unhide scroll bars.
    document.documentElement.style.overflow = this.docOrigOverflow;
    // Remove fullscreen styles
    _V_.removeClass(this.box, "vjs-fullscreen");
    // Resize the box, controller, and poster to original sizes
    this.positionAll();
    this.triggerListeners("exitFullWindow");
  },

  src: function(src){
    this.api.src.call(this, src);
    return this;
  }
});
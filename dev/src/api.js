/* Player API
================================================================================ */
VideoJS.fn.extend({

  apiCall: function(method, arg){
    if (this.isReady) {
      if (this.api[method]) {
        return this.api[method].call(this, arg);
      } else {
        throw new Error("The '"+method+"' method is not available on the playback technology's API");
      }
    } else {
      throw new Error("The playback technology API is not ready yet. Use player.ready(myFunction).");
    }
  },

  /* Listener types: play, pause, timeupdate, bufferedupdate, ended, volumechange, error */
  addEvent: function(type, fn){
    return _V_.addEvent(this.box, type, _V_.proxy(this, fn));
  },
  removeEvent: function(type, fn){
    return _V_.removeEvent(this.box, type, fn);
  },
  triggerEvent: function(type, e){
    return _V_.triggerEvent(this.box, type, e);
  },

  play: function(){
    this.apiCall("play"); return this;
  },
  pause: function(){
    this.apiCall("pause"); return this;
  },
  paused: function(){
    return this.apiCall("paused");
  },

  currentTime: function(seconds){
    if (seconds !== undefined) {
      this.values.currentTime = seconds; // Cache the last set value for smoother scrubbing.
      this.apiCall("setCurrentTime", seconds);
      if (this.manualTimeUpdates) { this.triggerEvent("timeupdate"); }
      return this;
    }
    return this.apiCall("currentTime");
  },
  duration: function(){
    return this.apiCall("duration");
  },
  remainingTime: function(){
    return this.duration() - this.currentTime();
  },

  buffered: function(){
    var buffered = this.apiCall("buffered"),
        start = 0, end = this.values.bufferEnd = this.values.bufferEnd || 0,
        timeRange;

    if (buffered && buffered.length > 0 && buffered.end(0) > end) {
      end = buffered.end(0);
      // Storing values allows them be overridden by setBufferedFromProgress
      this.values.bufferEnd = end;
    }

    return _V_.createTimeRange(start, end);
  },

  // Calculates amount of buffer is full
  bufferedPercent: function(){
    return (this.duration()) ? this.buffered().end(0) / this.duration() : 0;
  },

  volume: function(percentAsDecimal){
    if (percentAsDecimal !== undefined) {
      var vol = Math.max(0, Math.min(1, parseFloat(percentAsDecimal))); // Force value to between 0 and 1
      this.values.volume = vol;
      this.apiCall("setVolume", vol);
      this.setLocalStorage("volume", vol);
      return this;
    }
    // if (this.values.volume) { return this.values.volume; }
    return this.apiCall("volume");
  },
  muted: function(muted){
    if (muted !== undefined) {
      this.apiCall("setMuted", muted);
      return this;
    }
    return this.apiCall("muted");
  },

  width: function(width, skipListeners){
    if (width !== undefined) {
      this.box.width = width;
      this.box.style.width = width+"px";
      if (!skipListeners) { this.triggerEvent("resize"); }
      return this;
    }
    return parseInt(this.box.getAttribute("width"));
  },
  height: function(height){
    if (height !== undefined) {
      this.box.height = height;
      this.box.style.height = height+"px";
      this.triggerEvent("resize");
      return this;
    }
    return parseInt(this.box.getAttribute("height"));
  },
  size: function(width, height){
    // Skip resize listeners on width for optimization
    return this.width(width, true).height(height);
  },

  supportsFullScreen: function(){ return this.apiCall("supportsFullScreen"); },

  // Turn on fullscreen (or window) mode
  enterFullScreen: function(){
    if (this.supportsFullScreen()) {
      this.api("enterFullScreen");
    } else {
      this.enterFullWindow();
    }
    this.triggerEvent("enterFullScreen");
    return this;
  },

  exitFullScreen: function(){
    if (true || !this.supportsFullScreen()) {
      this.exitFullWindow();
    }
    this.triggerEvent("exitFullScreen");

    // Otherwise Shouldn't be called since native fullscreen uses own controls.
    return this;
  },

  enterFullWindow: function(){
    this.videoIsFullScreen = true;

    // Storing original doc overflow value to return to when fullscreen is off
    this.docOrigOverflow = document.documentElement.style.overflow;

    // Add listener for esc key to exit fullscreen
    _V_.addEvent(document, "keydown", _V_.proxy(this, this.fullscreenOnEscKey));

    // Add listener for a window resize
    _V_.addEvent(window, "resize", _V_.proxy(this, this.fullscreenOnWindowResize));

    // Hide any scroll bars
    document.documentElement.style.overflow = 'hidden';

    // Apply fullscreen styles
    _V_.addClass(document.body, "vjs-full-window");
    _V_.addClass(this.box, "vjs-fullscreen");

    this.triggerEvent("enterFullWindow");
  },

  exitFullWindow: function(){
    this.videoIsFullScreen = false;
    _V_.removeEvent(document, "keydown", this.fullscreenOnEscKey);
    _V_.removeEvent(window, "resize", this.fullscreenOnWindowResize);

    // Unhide scroll bars.
    document.documentElement.style.overflow = this.docOrigOverflow;

    // Remove fullscreen styles
    _V_.removeClass(document.body, "vjs-full-window");
    _V_.removeClass(this.box, "vjs-fullscreen");

    // Resize the box, controller, and poster to original sizes
    // this.positionAll();
    this.triggerEvent("exitFullWindow");
  },

  // src is a pretty powerful function
  // If you pass it an array of source objects, it will find the best source to play and use that object.src
  //   If the new source requires a new playback technology, it will switch to that.
  // If you pass it an object, it will set the source to object.src
  // If you pass it anything else (url string) it will set the video source to that
  src: function(source){
    // Case: Array of source objects to choose from and pick the best to play
    if (source instanceof Array) {

      techLoop: // Named loop for breaking both loops
      // Loop through each playback technology in the options order
      for (var i=0,j=this.options.techOrder;i<j.length;i++) {
        var techName = j[i],
            tech = _V_.tech[techName];

        // Check if the browser supports this technology
        if (tech.supported()) {

          // Loop through each source object
          for (var a=0,b=this.options.sources;a<b.length;a++) {
            var source = b[a];

            // Check if source can be played with this technology
            if (tech.canPlaySource.call(this, source)) {

              // If this technology is already loaded, set source
              if (techName == this.currentTechName) {
                this.src(source); // Passing the source object

              // Otherwise load this technology with chosen source
              } else {
                this.loadTech(techName, source);
              }

              break techLoop; // Break both loops
            }
          }
        }
      }

    // Case: Source object { src: "", type: "" ... }
    } else if (source instanceof Object) {
      this.src(source.src);

    // Case: URL String (http://myvideo...)
    } else {
      this.apiCall("src", source);
      this.load();
    }
    return this;
  },

  // Begin loading the src data
  load: function(){
    this.apiCall("load");
    return this;
  },
  currentSrc: function(){
    return this.apiCall("currentSrc");
  },

  textTrackValue: function(kind, value){
    if (value !== undefined) {
      this.values[kind] = value;
      this.triggerEvent(kind+"update");
      return this;
    }
    return this.values[kind];
  },

  // Attributes/Options
  preload: function(value){
    if (value !== undefined) {
      this.apiCall("setPreload", value);
      this.options.preload = value;
      return this;
    }
    return this.apiCall("preload", value);
  },
  autoplay: function(value){
    if (value !== undefined) {
      this.apiCall("setAutoplay", value);
      this.options.autoplay = value;
      return this;
    }
    return this.apiCall("autoplay", value);
  },
  loop: function(value){
    if (value !== undefined) {
      this.apiCall("setLoop", value);
      this.options.loop = value;
      return this;
    }
    return this.apiCall("loop", value);
  },

  controls: function(){ return this.options.controls; },
  textTracks: function(){ return this.options.tracks; },

  error: function(){ return this.apiCall("error"); },
  networkState: function(){ return this.apiCall("networkState"); },
  readyState: function(){ return this.apiCall("readyState"); },
  seeking: function(){ return this.apiCall("seeking"); },
  initialTime: function(){ return this.apiCall("initialTime"); },
  startOffsetTime: function(){ return this.apiCall("startOffsetTime"); },
  played: function(){ return this.apiCall("played"); },
  seekable: function(){ return this.apiCall("seekable"); },
  ended: function(){ return this.apiCall("ended"); },
  videoTracks: function(){ return this.apiCall("videoTracks"); },
  audioTracks: function(){ return this.apiCall("audioTracks"); },
  videoWidth: function(){ return this.apiCall("videoWidth"); },
  videoHeight: function(){ return this.apiCall("videoHeight"); },
  defaultPlaybackRate: function(){ return this.apiCall("defaultPlaybackRate"); },
  playbackRate: function(){ return this.apiCall("playbackRate"); },
  // mediaGroup: function(){ return this.apiCall("mediaGroup"); },
  // controller: function(){ return this.apiCall("controller"); },
  controls: function(){ return this.apiCall("controls"); },
  defaultMuted: function(){ return this.apiCall("defaultMuted"); }
});

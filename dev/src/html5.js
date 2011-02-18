/* HTML5 Player Type
================================================================================ */
VideoJS.fn.extend({

  html5Supported: function(){
    if (VideoJS.browserSupportsVideo() && this.canPlaySource()) {
      return true;
    } else {
      return false;
    }
  },

  html5Init: function(){
    this.element = this.video;
    this.api = this.html5API;
    this.api.setupTriggers.call(this);

    this.fixPreloading(); // Support old browsers that used autobuffer
    this.supportProgressEvents(); // Support browsers that don't use 'buffered'

    // Set to stored volume OR 85%
    this.volume((localStorage && localStorage.volume) || this.options.defaultVolume);

    // Update interface for device needs
    if (VideoJS.isIOS()) {
      this.options.useBuiltInControls = true;
      this.iOSInterface();
    } else if (VideoJS.isAndroid()) {
      this.options.useBuiltInControls = true;
      this.androidInterface();
    }

    // Add VideoJS Controls
    if (!this.options.useBuiltInControls) {
      this.video.controls = false;

      if (this.options.controlsBelow) { _V_.addClass(this.box, "vjs-controls-below"); }

      // Make a click on th video act as a play button
      this.activateElement(this.video, "playToggle");

      // Build Interface
      this.buildStylesCheckDiv(); // Used to check if style are loaded
      this.buildAndActivatePoster();
      this.buildBigPlayButton();
      this.buildAndActivateSpinner();
      this.buildAndActivateControlBar();
      this.loadInterface(); // Show everything once styles are loaded
      this.getSubtitles();
    }
  },
  /* Source Managemet
  ================================================================================ */
  canPlaySource: function(){
    // Cache Result
    if (this.canPlaySourceResult) { return this.canPlaySourceResult; }
    // Loop through sources and check if any can play
    var children = this.video.children;
    for (var i=0,j=children.length; i<j; i++) {
      if (children[i].tagName.toUpperCase() == "SOURCE") {
        var canPlay = this.video.canPlayType(children[i].type) || this.canPlayExt(children[i].src);
        if (canPlay == "probably" || canPlay == "maybe") {
          this.firstPlayableSource = children[i];
          this.canPlaySourceResult = true;
          return true;
        }
      }
    }
    this.canPlaySourceResult = false;
    return false;
  },
  // Check if the extention is compatible, for when type won't work
  canPlayExt: function(src){
    if (!src) { return ""; }
    var match = src.match(/\.([^\.]+)$/);
    if (match && match[1]) {
      var ext = match[1].toLowerCase();
      // Android canPlayType doesn't work
      if (VideoJS.isAndroid()) {
        if (ext == "mp4" || ext == "m4v") { return "maybe"; }
      // Allow Apple HTTP Streaming for iOS
      } else if (VideoJS.isIOS()) {
        if (ext == "m3u8") { return "maybe"; }
      }
    }
    return "";
  },
  // Force the video source - Helps fix loading bugs in a handful of devices, like the iPad/iPhone poster bug
  // And iPad/iPhone javascript include location bug. And Android type attribute bug
  forceTheSource: function(){
    this.video.src = this.firstPlayableSource.src; // From canPlaySource()
    this.video.load();
  },
  /* Device Fixes
  ================================================================================ */
  // Support older browsers that used "autobuffer"
  fixPreloading: function(){
    if (typeof this.video.hasAttribute == "function" && this.video.hasAttribute("preload") && this.video.preload != "none") {
      this.video.autobuffer = true; // Was a boolean
    } else {
      this.video.autobuffer = false;
      this.video.preload = "none";
    }
  },

  // Listen for Video Load Progress (currently does not if html file is local)
  // Buffered does't work in all browsers, so watching progress as well
  supportProgressEvents: function(e){
    _V_.addListener(this.video, 'progress', this.setBufferedFromProgress.context(this));
  },
  // playerOnVideoProgress: function(event){
  //   this.setBufferedFromProgress(event);
  // },
  setBufferedFromProgress: function(event){ // HTML5 Only
    if(event.total > 0 && this.duration()) {
      var newBufferEnd = (event.loaded / event.total) * this.duration();
      if (newBufferEnd > this.values.bufferEnd) {
        this.values.bufferEnd = newBufferEnd;
        this.triggerListeners("bufferedupdate");
      }
    }
  },

  iOSInterface: function(){
    if(VideoJS.iOSVersion() < 4) { this.forceTheSource(); } // Fix loading issues
    if(VideoJS.isIPad()) { // iPad could work with controlsBelow
      this.buildAndActivateSpinner(); // Spinner still works well on iPad, since iPad doesn't have one
    }
  },

  // Fix android specific quirks
  // Use built-in controls, but add the big play button, since android doesn't have one.
  androidInterface: function(){
    this.forceTheSource(); // Fix loading issues
    _V_.addListener(this.video, "click", function(){ this.play(); }); // Required to play
    this.buildBigPlayButton(); // But don't activate the normal way. Pause doesn't work right on android.
    _V_.addListener(this.bigPlayButton, "click", function(){ this.play(); }.context(this));
    this.positionBox();
    this.showBigPlayButtons();
  },
  /* Wait for styles (TODO: move to _V_)
  ================================================================================ */
  loadInterface: function(){
    if(!this.stylesHaveLoaded()) {
      // Don't want to create an endless loop either.
      if (!this.positionRetries) { this.positionRetries = 1; }
      if (this.positionRetries++ < 100) {
        setTimeout(this.loadInterface.context(this),10);
        return;
      }
    }
    this.hideStylesCheckDiv();
    this.showPoster();
    if (this.video.paused !== false) { this.showBigPlayButtons(); }
    if (this.options.controlsAtStart) { this.showControlBars(); }
    this.positionAll();
  },
  /* Control Bar
  ================================================================================ */
  buildAndActivateControlBar: function(){
    /* Creating this HTML
      <div class="vjs-controls">
        <div class="vjs-play-control">
          <span></span>
        </div>
        <div class="vjs-progress-control">
          <div class="vjs-progress-holder">
            <div class="vjs-load-progress"></div>
            <div class="vjs-play-progress"></div>
          </div>
        </div>
        <div class="vjs-time-control">
          <span class="vjs-current-time-display">00:00</span><span> / </span><span class="vjs-duration-display">00:00</span>
        </div>
        <div class="vjs-volume-control">
          <div>
            <span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
        </div>
        <div class="vjs-fullscreen-control">
          <div>
            <span></span><span></span><span></span><span></span>
          </div>
        </div>
      </div>
    */

    // Create a div to hold the different controls
    this.controls = _V_.createElement("div", { className: "vjs-controls" });
    // Add the controls to the video's container
    this.box.appendChild(this.controls);
    this.activateElement(this.controls, "controlBar");
    this.activateElement(this.controls, "mouseOverVideoReporter");

    // Build the play control
    this.playControl = _V_.createElement("div", { className: "vjs-play-control", innerHTML: "<span></span>" });
    this.controls.appendChild(this.playControl);
    this.activateElement(this.playControl, "playToggle");

    // Build the progress control
    this.progressControl = _V_.createElement("div", { className: "vjs-progress-control" });
    this.controls.appendChild(this.progressControl);

    // Create a holder for the progress bars
    this.progressHolder = _V_.createElement("div", { className: "vjs-progress-holder" });
    this.progressControl.appendChild(this.progressHolder);
    this.activateElement(this.progressHolder, "currentTimeScrubber");

    // Create the loading progress display
    this.loadProgressBar = _V_.createElement("div", { className: "vjs-load-progress" });
    this.progressHolder.appendChild(this.loadProgressBar);
    this.activateElement(this.loadProgressBar, "loadProgressBar");

    // Create the playing progress display
    this.playProgressBar = _V_.createElement("div", { className: "vjs-play-progress" });
    this.progressHolder.appendChild(this.playProgressBar);
    this.activateElement(this.playProgressBar, "playProgressBar");

    // Create the progress time display (00:00 / 00:00)
    this.timeControl = _V_.createElement("div", { className: "vjs-time-control" });
    this.controls.appendChild(this.timeControl);

    // Create the current play time display
    this.currentTimeDisplay = _V_.createElement("span", { className: "vjs-current-time-display", innerHTML: "00:00" });
    this.timeControl.appendChild(this.currentTimeDisplay);
    this.activateElement(this.currentTimeDisplay, "currentTimeDisplay");

    // Add time separator
    this.timeSeparator = _V_.createElement("span", { innerHTML: " / " });
    this.timeControl.appendChild(this.timeSeparator);

    // Create the total duration display
    this.durationDisplay = _V_.createElement("span", { className: "vjs-duration-display", innerHTML: "00:00" });
    this.timeControl.appendChild(this.durationDisplay);
    this.activateElement(this.durationDisplay, "durationDisplay");

    // Create the volumne control
    this.volumeControl = _V_.createElement("div", {
      className: "vjs-volume-control",
      innerHTML: "<div><span></span><span></span><span></span><span></span><span></span><span></span></div>"
    });
    this.controls.appendChild(this.volumeControl);
    this.activateElement(this.volumeControl, "volumeScrubber");

    this.volumeDisplay = this.volumeControl.children[0];
    this.activateElement(this.volumeDisplay, "volumeDisplay");

    // Crete the fullscreen control
    this.fullscreenControl = _V_.createElement("div", {
      className: "vjs-fullscreen-control",
      innerHTML: "<div><span></span><span></span><span></span><span></span></div>"
    });
    this.controls.appendChild(this.fullscreenControl);
    this.activateElement(this.fullscreenControl, "fullscreenToggle");
  },
  /* Poster Image
  ================================================================================ */
  buildAndActivatePoster: function(){
    this.updatePosterSource();
    if (this.video.poster) {
      this.poster = document.createElement("img");
      // Add poster to video box
      this.box.appendChild(this.poster);

      // Add poster image data
      this.poster.src = this.video.poster;
      // Add poster styles
      this.poster.className = "vjs-poster";
      this.activateElement(this.poster, "poster");
    } else {
      this.poster = false;
    }
  },
  /* Big Play Button
  ================================================================================ */
  buildBigPlayButton: function(){
    /* Creating this HTML
      <div class="vjs-big-play-button"><span></span></div>
    */
    this.bigPlayButton = _V_.createElement("div", {
      className: "vjs-big-play-button",
      innerHTML: "<span></span>"
    });
    this.box.appendChild(this.bigPlayButton);
    this.activateElement(this.bigPlayButton, "bigPlayButton");
  },
  /* Spinner (Loading)
  ================================================================================ */
  buildAndActivateSpinner: function(){
    this.spinner = _V_.createElement("div", {
      className: "vjs-spinner",
      innerHTML: "<div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>"
    });
    this.box.appendChild(this.spinner);
    this.activateElement(this.spinner, "spinner");
  },
  /* Styles Check - Check if styles are loaded (move ot _V_)
  ================================================================================ */
  // Sometimes the CSS styles haven't been applied to the controls yet
  // when we're trying to calculate the height and position them correctly.
  // This causes a flicker where the controls are out of place.
  buildStylesCheckDiv: function(){
    this.stylesCheckDiv = _V_.createElement("div", { className: "vjs-styles-check" });
    this.stylesCheckDiv.style.position = "absolute";
    this.box.appendChild(this.stylesCheckDiv);
  },
  hideStylesCheckDiv: function(){ this.stylesCheckDiv.style.display = "none"; },
  stylesHaveLoaded: function(){
    if (this.stylesCheckDiv.offsetHeight != 5) {
       return false;
    } else {
      return true;
    }
  },
  /* VideoJS Box - Holds all elements
  ================================================================================ */
  positionAll: function(){
    this.positionBox();
    this.positionControlBars();
    this.positionPoster();
  },
  positionBox: function(){
    // Set width based on fullscreen or not.
    if (this.videoIsFullScreen) {
      this.box.style.width = "";
      this.element.style.height="";
      if (this.options.controlsBelow) {
        this.box.style.height = "";
        this.element.style.height = (this.box.offsetHeight - this.controls.offsetHeight) + "px";
      }
    } else {
      this.box.style.width = this.width() + "px";
      this.element.style.height=this.height()+"px";
      if (this.options.controlsBelow) {
        this.element.style.height = "";
        // this.box.style.height = this.video.offsetHeight + this.controls.offsetHeight + "px";
      }
    }
  },
  /* Subtitles
  ================================================================================ */
  getSubtitles: function(){
    var tracks = this.video.getElementsByTagName("TRACK");
    for (var i=0,j=tracks.length; i<j; i++) {
      if (tracks[i].getAttribute("kind") == "subtitles" && tracks[i].getAttribute("src")) {
        this.subtitlesSource = tracks[i].getAttribute("src");
        this.loadSubtitles();
        this.buildSubtitles();
      }
    }
  },
  loadSubtitles: function() { _V_.get(this.subtitlesSource, this.parseSubtitles.context(this)); },
  parseSubtitles: function(subText) {
    var lines = subText.split("\n"),
        line = "",
        subtitle, time, text;
    this.subtitles = [];
    this.currentSubtitle = false;
    this.lastSubtitleIndex = 0;

    for (var i=0; i<lines.length; i++) {
      line = _V_.trim(lines[i]); // Trim whitespace and linebreaks
      if (line) { // Loop until a line with content

        // First line - Number
        subtitle = {
          id: line, // Subtitle Number
          index: this.subtitles.length // Position in Array
        };

        // Second line - Time
        line = _V_.trim(lines[++i]);
        time = line.split(" --> ");
        subtitle.start = this.parseSubtitleTime(time[0]);
        subtitle.end = this.parseSubtitleTime(time[1]);

        // Additional lines - Subtitle Text
        text = [];
        for (var j=i; j<lines.length; j++) { // Loop until a blank line or end of lines
          line = _V_.trim(lines[++i]);
          if (!line) { break; }
          text.push(line);
        }
        subtitle.text = text.join('<br/>');

        // Add this subtitle
        this.subtitles.push(subtitle);
      }
    }
  },

  parseSubtitleTime: function(timeText) {
    var parts = timeText.split(':'),
        time = 0;
    // hours => seconds
    time += parseFloat(parts[0])*60*60;
    // minutes => seconds
    time += parseFloat(parts[1])*60;
    // get seconds
    var seconds = parts[2].split(/\.|,/); // Either . or ,
    time += parseFloat(seconds[0]);
    // add miliseconds
    ms = parseFloat(seconds[1]);
    if (ms) { time += ms/1000; }
    return time;
  },

  buildSubtitles: function(){
    /* Creating this HTML
      <div class="vjs-subtitles"></div>
    */
    this.subtitlesDisplay = _V_.createElement("div", { className: 'vjs-subtitles' });
    this.box.appendChild(this.subtitlesDisplay);
    this.activateElement(this.subtitlesDisplay, "subtitlesDisplay");
  },

  /* Player API - Translate functionality from player to video
  ================================================================================ */
  html5API: {
    setupTriggers: function(){
      // Make video events trigger player events
      // May seem verbose here, but makes other APIs possible.
      var types = ["play", "pause", "ended", "volumechange", "error"],
          player = this, i, type;
      for (i = 0; i<types.length; i++) {
        type = types[i];
        _V_.addListener(this.video, type, function(e){
          player.triggerListeners(this, e);
        }.context(type));
      }
    },

    play: function(){ this.video.play(); },
    pause: function(){ this.video.pause(); },
    paused: function(){ return this.video.paused; },

    currentTime: function(){ return this.video.currentTime; },
    setCurrentTime: function(seconds){
      try { this.video.currentTime = seconds; }
      catch(e) { this.warning(VideoJS.warnings.videoNotReady); }
    },

    duration: function(){ return this.video.duration; },
    buffered: function(){ return this.video.buffered; },

    volume: function(){ return this.video.volume; },
    setVolume: function(percentAsDecimal){ this.video.volume = percentAsDecimal; },

    width: function(){ return this.video.offsetWidth; },
    height: function(){ return this.video.offsetHeight; },

    supportsFullScreen: function(){
      if(typeof this.video.webkitEnterFullScreen == 'function') {
        // Seems to be broken in Chromium/Chrome && Safari in Leopard
        if (!navigator.userAgent.match("Chrome") && !navigator.userAgent.match("Mac OS X 10.5")) {
          return true;
        }
      }
      return false;
    },
    enterFullScreen: function(){
      try {
        this.video.webkitEnterFullScreen();
      } catch (e) {
        if (e.code == 11) { this.warning(VideoJS.warnings.videoNotReady); }
      }
    },
    src: function(src){
      this.video.src = src;
      this.video.load();
    }
  }
});


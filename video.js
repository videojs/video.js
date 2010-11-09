/*
VideoJS - HTML5 Video Player
v1.1.5

This file is part of VideoJS. Copyright 2010 Zencoder, Inc.

VideoJS is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

VideoJS is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with VideoJS.  If not, see <http://www.gnu.org/licenses/>.
*/

// Using jresig's Class implementation http://ejohn.org/blog/simple-javascript-inheritance/
(function(){var initializing=false, fnTest=/xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/; this.JRClass = function(){}; JRClass.extend = function(prop) { var _super = this.prototype; initializing = true; var prototype = new this(); initializing = false; for (var name in prop) { prototype[name] = typeof prop[name] == "function" && typeof _super[name] == "function" && fnTest.test(prop[name]) ? (function(name, fn){ return function() { var tmp = this._super; this._super = _super[name]; var ret = fn.apply(this, arguments); this._super = tmp; return ret; }; })(name, prop[name]) : prop[name]; } function JRClass() { if ( !initializing && this.init ) this.init.apply(this, arguments); } JRClass.prototype = prototype; JRClass.constructor = JRClass; JRClass.extend = arguments.callee; return JRClass;};})();

// Video JS Player Class
var VideoJS = JRClass.extend({

  // Initialize the player for the supplied video tag element
  // element: video tag
  init: function(element, setOptions){

    // Allow an ID string or an element
    if (typeof element == 'string') {
      this.video = document.getElementById(element);
    } else {
      this.video = element;
    }
    // Store reference to player on the video element.
    // So you can acess the player later: document.getElementById("video_id").player.play();
    this.video.player = this;

    // Default Options
    this.options = {
      controlsBelow: false, // Display control bar below video vs. in front of
      showControlsAtStart: false, // Make controls visible when page loads
      controlsHiding: true, // Hide controls when not over the video
      defaultVolume: 0.85, // Will be overridden by localStorage volume if available
      flashVersion: 9, // Required flash version for fallback
      linksHiding: true, // Hide download links when video is supported
      flashIsDominant: false, // Always use Flash when available
      useBrowserControls: false, // Dont' use the video JS controls (iPhone)
      players: ["html5", "flashObject", "links"] // Players and order to use them
    };
    // Override default options with global options
    if (typeof VideoJS.options == "object") { _V_.merge(this.options, VideoJS.options); }
    // Override default & global options with options specific to this player
    if (typeof setOptions == "object") { _V_.merge(this.options, setOptions); }

    // Store reference to embed code pieces
    this.box = this.video.parentNode;
    this.flashObject = this.getFlashObject();
    this.linksFallback = this.getLinksFallback();
    this.hideLinksFallback(); // Will be shown again if "links" player is used

    // Loop through the player names list in options, "html5" etc.
    // For each player name, initialize the player with that name under VideoJS.players
    // If the player successfully initializes, we're done
    // If not, try the next player in the list
    for (var i=0,players=this.options.players,j=players.length; i<j; i++) {
      if((VideoJS.players[players[i]].init.context(this))()) {
        break;
      }
    }
  },

  html5Init: function(){
    this.fixPreloading(); // Support older browsers that used autobuffer

    if (VideoJS.isIOS()) {
      this.options.useBrowserControls = true;
      if(VideoJS.iOSVersion() < 4) {
        this.forceTheSource();
      }
    }

    if (VideoJS.isAndroid()) {
      this.options.useBrowserControls = true;
      this.forceTheSource();
      this.video.addEventListener("click", function(){ this.play(); }, false);
    }

    // Add VideoJS Controls
    if (!this.options.useBrowserControls) {
      this.video.controls = false;

      if (this.options.controlsBelow) { _V_.addClass(this.box, "vjs-controls-below"); }
      this.percentLoaded = 0; // Store amount of video loaded

      // Build Interface
      this.buildStylesCheckDiv(); // Used to check if style are loaded
      this.buildPoster();
      this.buildBigPlayButton();
      this.buildSpinner();
      this.buildControlBar();
      this.loadInterface(); // Show everything once styles are loaded
      this.getSubtitles();

      /* Removeable Event Listeners with Context
      ================================================================================ */
      // These event listeners are attached to global elements like document/window.
      // They are also temporary, which means they need to be removed.
      // They also need context (this) so they can call functions on their specific player.
      // Adding context on initialization allows them to referenced and removed after being attached.
      this.onEscKey = this.onEscKey.context(this);
      this.onWindowResize = this.onWindowResize.context(this);
      this.onProgressMouseMove = this.onProgressMouseMove.context(this);
      this.onProgressMouseUp = this.onProgressMouseUp.context(this);
      this.onVolumeMouseMove = this.onVolumeMouseMove.context(this);
      this.onVolumeMouseUp = this.onVolumeMouseUp.context(this);
    }
  },

  canPlaySource: function(){
    // Cache Result
    if (this.canPlaySourceResult) { return this.canPlaySourceResult; }
    // Loop through sources and check if any can play
    var children = this.video.children;
    for (var i=0,j=children.length; i<j; i++) {
      if (children[i].tagName.toUpperCase() == "SOURCE") {
        var canPlay = this.video.canPlayType(children[i].type);
        if(canPlay == "probably" || canPlay == "maybe"
          || (VideoJS.isAndroid() && children[i].src.match(/\.(mp4|m4v)$/i))) {
          this.firstPlayableSource = children[i];
          this.canPlaySourceResult = true;
          return true;
        }
      }
    }
    this.canPlaySourceResult = false;
    return false;
  },

  // Force the video source - Helps fix loading bugs in a handful of devices, like the iPad/iPhone poster bug
  // And iPad/iPhone javascript include location bug. And Android type attribute bug
  forceTheSource: function(){
    this.video.src = this.firstPlayableSource.src; // From canPlaySource()
    this.video.load();
  },

  loadInterface: function(){
    if(!this.stylesHaveLoaded()) {
      // Don't want to create an endless loop either.
      if (!this.positionRetries) { this.positionRetries = 1; }
      if (this.positionRetries++ < 100) {
        setTimeout(this.loadInterface.context(this),0);
        return;
      }
    }
    this.hideStylesCheckDiv();
    this.showPoster();
    if (this.video.paused !== false) { this.showBigPlayButton(); }
    if (this.options.showControlsAtStart) { this.showControlBar(); }
    this.positionBox();
  },

  /* VideoJS Box - Holds all elements
  ================================================================================ */
  positionBox: function(){
    // Set width based on fullscreen or not.
    if (this.videoIsFullScreen) {
      this.box.style.width = "";
      if (this.options.controlsBelow) {
        this.box.style.height = "";
        this.video.style.height = (this.box.offsetHeight - this.controls.offsetHeight) + "px";
      }
    } else {
      this.box.style.width = this.video.offsetWidth + "px";
      if (this.options.controlsBelow) {
        this.video.style.height = "";
        this.box.style.height = this.video.offsetHeight + this.controls.offsetHeight + "px";
      }
    }
    this.positionControlBar();
    this.positionPoster();
  },

  /* Control Bar
  ================================================================================ */
  buildControlBar: function(){
    /* Creating this HTML
      <ul class="vjs-controls">
        <li class="vjs-play-control vjs-play">
          <span></span>
        </li>
        <li class="vjs-progress-control">
          <ul class="vjs-progress-holder">
            <li class="vjs-load-progress"></li>
            <li class="vjs-play-progress"></li>
          </ul>
        </li>
        <li class="vjs-time-control">
          <span class="vjs-current-time-display">00:00</span><span> / </span><span class="vjs-duration-display">00:00</span>
        </li>
        <li class="vjs-volume-control">
          <ul>
            <li></li><li></li><li></li><li></li><li></li><li></li>
          </ul>
        </li>
        <li class="vjs-fullscreen-control">
          <ul>
            <li></li><li></li><li></li><li></li>
          </ul>
        </li>
      </ul>
    */

    // Create a list element to hold the different controls
    this.controls = _V_.createElement("ul", { className: "vjs-controls" });
    // Add the controls to the video's container
    this.video.parentNode.appendChild(this.controls);

    // Build the play control
    this.playControl = _V_.createElement("li", { className: "vjs-play-control vjs-play", innerHTML: "<span></span>" });
    this.controls.appendChild(this.playControl);

    // Build the progress control
    this.progressControl = _V_.createElement("li", { className: "vjs-progress-control" });
    this.controls.appendChild(this.progressControl);

    // Create a holder for the progress bars
    this.progressHolder = _V_.createElement("ul", { className: "vjs-progress-holder" });
    this.progressControl.appendChild(this.progressHolder);

    // Create the loading progress display
    this.loadProgress = _V_.createElement("li", { className: "vjs-load-progress" });
    this.progressHolder.appendChild(this.loadProgress);

    // Create the playing progress display
    this.playProgress = _V_.createElement("li", { className: "vjs-play-progress" });
    this.progressHolder.appendChild(this.playProgress);

    // Create the progress time display (00:00 / 00:00)
    this.timeControl = _V_.createElement("li", { className: "vjs-time-control" });
    this.controls.appendChild(this.timeControl);

    // Create the current play time display
    this.currentTimeDisplay = _V_.createElement("span", { className: "vjs-current-time-display", innerHTML: "00:00" });
    this.timeControl.appendChild(this.currentTimeDisplay);

    // Add time separator
    this.timeSeparator = _V_.createElement("span", { innerHTML: " / " });
    this.timeControl.appendChild(this.timeSeparator);

    // Create the total duration display
    this.durationDisplay = _V_.createElement("span", { className: "vjs-duration-display", innerHTML: "00:00" });
    this.timeControl.appendChild(this.durationDisplay);

    // Create the volumne control
    this.volumeControl = _V_.createElement("li", {
      className: "vjs-volume-control",
      innerHTML: "<ul><li></li><li></li><li></li><li></li><li></li><li></li></ul>"
    });
    this.controls.appendChild(this.volumeControl);
    this.volumeDisplay = this.volumeControl.children[0];

    // Crete the fullscreen control
    this.fullscreenControl = _V_.createElement("li", {
      className: "vjs-fullscreen-control",
      innerHTML: "<ul><li></li><li></li><li></li><li></li></ul>"
    });
    this.controls.appendChild(this.fullscreenControl);

    this.initializeControls();
  },
  // Set up Event Listeners
  initializeControls: function(){
    /* Initialize Errors
    ================================================================================ */
    this.video.addEventListener('error',this.onError.context(this),false);

    /* Initialize Play/Pause
    ================================================================================ */
    // Listen for when the video is played
    this.video.addEventListener("play", this.onPlay.context(this), false);
    // Listen for when the video is paused
    this.video.addEventListener("pause", this.onPause.context(this), false);
    // Listen for when the video ends
    this.video.addEventListener("ended", this.onEnded.context(this), false);
    // Listen for clicks on the play/pause button
    this.playControl.addEventListener("click", this.onPlayControlClick.context(this), false);
    // Make a click on the video act like a click on the play button.
    this.video.addEventListener("click", this.onPlayControlClick.context(this), false);

    /* Initialize Play Progress
    ================================================================================ */
    // Listen for drags on the progress bar
    this.progressHolder.addEventListener("mousedown", this.onProgressHolderMouseDown.context(this), false);
    // Listen for a release on the progress bar
    this.progressHolder.addEventListener("mouseup", this.onProgressHolderMouseUp.context(this), false);

    /* Initialize Buffering Progress
    ================================================================================ */
    // Listen for Video Load Progress (currently does not if html file is local)
    this.video.addEventListener('progress', this.onProgress.context(this), false);
    // Set interval for load progress using buffer watching method
    this.watchBuffer = setInterval(this.updateBufferedTotal.context(this), 33);

    /* Initialize Volume
    ================================================================================ */
    // Set to stored volume OR 85%
    this.setVolume(localStorage.volume || this.options.defaultVolume);
    // Set the display to the initial volume
    this.updateVolumeDisplay();
    // Listen for a volume change
    this.video.addEventListener('volumechange',this.onVolumeChange.context(this),false);
    // Listen for a drag on the volume control
    this.volumeControl.addEventListener("mousedown", this.onVolumeControlMouseDown.context(this), false);
    // Listen for a release on the volume control
    this.volumeControl.addEventListener("mouseup", this.onVolumeControlMouseUp.context(this), false);

    /* Initialize Fullscreen
    ================================================================================ */
    // Listen for clicks on the button
    this.fullscreenControl.addEventListener("click", this.onFullscreenControlClick.context(this), false);

    /* Initialize Controls Movement
    ================================================================================ */
    // Block hiding when over controls
    this.controls.addEventListener("mousemove", this.onControlsMouseMove.context(this), false);
    // Release controls hiding block, and call VideoMouseOut
    this.controls.addEventListener("mouseout", this.onControlsMouseOut.context(this), false);
    // Listen for the mouse move the video. Used to reveal the controller.
    this.box.addEventListener("mousemove", this.onVideoMouseMove.context(this), false);
    // Listen for the mouse moving out of the video. Used to hide the controller.
    this.box.addEventListener("mouseout", this.onVideoMouseOut.context(this), false);
  },
  showControlBar: function(){
    if (!this.options.showControlsAtStart && !this.hasPlayed) { return; }
    this.controls.style.display = "block";
    this.positionControlBar();
  },
  // Place controller relative to the video's position
  positionControlBar: function(){
    // Make sure the controls are visible
    if (this.controls.style.display == 'none') { return; }

    if (this.options.controlsBelow) {
      this.controls.style.top = this.video.offsetHeight + "px";
    } else {
      this.controls.style.top = (this.video.offsetHeight - this.controls.offsetHeight) + "px";
    }
    this.updatePlayProgress();
    this.updateLoadProgress();
  },
  hideControlBar: function(){
    if (this.options.controlsHiding && !this.mouseIsOverControls) { this.controls.style.display = "none"; }
  },
  onControlsMouseMove: function(){
    // Block controls from hiding when mouse is over them.
    this.mouseIsOverControls = true;
  },
  onControlsMouseOut: function(event){
    this.mouseIsOverControls = false;
    // Have to add the video mouseout to the controller too or it may not hide.
    this.onVideoMouseOut(event);
  },
  onVideoMouseMove: function(){
    this.showControlBar();
    clearInterval(this.mouseMoveTimeout);
    this.mouseMoveTimeout = setTimeout(function(){ this.hideControlBar(); }.context(this), 4000);
  },
  onVideoMouseOut: function(event){
    // Prevent flicker by making sure mouse hasn't left the video
    var parent = event.relatedTarget;
    while (parent && parent !== this.video && parent !== this.controls) {
      parent = parent.parentNode;
    }
    if (parent !== this.video && parent !== this.controls) {
      this.hideControlBar();
    }
  },

  /* Errors
  ================================================================================ */
  errors: [], // Array to track errors
  onError: function(event){ this.log(this.video.error); },

  /* Play/Pause
  ================================================================================ */
  // React to clicks on the play/pause button
  onPlayControlClick: function(event){
    if (this.video.paused) {
      this.video.play();
    } else {
      // Android has a problem with "paused" not returning correctly.
      if (!this.hasPlayed && VideoJS.isAndroid) {
        this.video.play(); return;
      } else {
        this.video.pause();
      }
    }
  },
  // When the video is played
  onPlay: function(event){
    this.hasPlayed = true;
    this.playControl.className = "vjs-play-control vjs-pause";
    this.trackPlayProgress();
  },
  // When the video is paused
  onPause: function(event){
    this.playControl.className = "vjs-play-control vjs-play";
    this.stopTrackingPlayProgress();
  },
  // When the video ends
  onEnded: function(event){
    this.video.currentTime = 0;
    this.video.pause();
  },

  /* Play Progress
  ================================================================================ */
  // Track & display the current play progress
  trackPlayProgress: function(){
    if(this.playProgressInterval) { clearInterval(this.playProgressInterval); }
    this.playProgressInterval = setInterval(function(){ this.updatePlayProgress(); }.context(this), 33);
  },
  // Turn off play progress tracking (when paused)
  stopTrackingPlayProgress: function(){ clearInterval(this.playProgressInterval); },
  // Ajust the play progress bar's width based on the current play time
  updatePlayProgress: function(){
    if (this.controls.style.display == 'none') { return; }
    this.playProgress.style.width = ((this.video.currentTime / this.video.duration) * (_V_.getComputedStyleValue(this.progressHolder, "width").replace("px", ""))) + "px";
    this.updateTimeDisplay();
  },
  // Update the play position based on where the user clicked on the progresss bar
  setPlayProgress: function(newProgress){
    try { this.video.currentTime = newProgress * this.video.duration; }
      catch(e) {
        if (e.code == 11) { this.errors.push(VideoJS.errorCodes.videoNotReady); }
      }
    this.playProgress.style.width = newProgress * (_V_.getComputedStyleValue(this.progressHolder, "width").replace("px", "")) + "px";
    this.updateTimeDisplay();
    // currentTime changed, reset subtitles
    if (!this.subtitles) { this.currentSubtitlePosition = 0; }
  },
  setPlayProgressWithEvent: function(event){
    var newProgress = _V_.getRelativePosition(event.pageX, this.progressHolder);
    this.setPlayProgress(newProgress);
  },
  // Adjust the play position when the user drags on the progress bar
  onProgressHolderMouseDown: function(event){
    this.stopTrackingPlayProgress();

    if (this.video.paused) {
      this.videoWasPlaying = false;
    } else {
      this.videoWasPlaying = true;
      this.video.pause();
    }
    _V_.blockTextSelection();
    this.setPlayProgressWithEvent(event);
    document.addEventListener("mousemove", this.onProgressMouseMove, false);
    document.addEventListener("mouseup", this.onProgressMouseUp, false);
  },
  onProgressMouseMove: function(event){ // Removeable
    this.setPlayProgressWithEvent(event);
  },
  onProgressMouseUp: function(event){ // Removeable
    _V_.unblockTextSelection();
    document.removeEventListener("mousemove", this.onProgressMouseMove, false);
    document.removeEventListener("mouseup", this.onProgressMouseUp, false);
    if (this.videoWasPlaying) {
      this.video.play();
      this.trackPlayProgress();
    }
  },
  // When the user stops dragging on the progress bar, update play position
  // Backup for when the user only clicks and doesn't drag
  onProgressHolderMouseUp: function(event){
    // Removed. Chrome breaks (shows poster, plays audio) if you set currentTime rapidly.
    // this.setPlayProgressWithEvent(event);

    // Fix for a play button state issue.
    if (this.video.paused) {
      this.onPause();
    } else {
      this.onPlay();
    }
  },

  // Update the displayed time (00:00)
  updateTimeDisplay: function(){
    this.currentTimeDisplay.innerHTML = _V_.formatTime(this.video.currentTime);
    if (this.video.duration) { this.durationDisplay.innerHTML = _V_.formatTime(this.video.duration); }
  },

  /* Load Progress
  ================================================================================ */
  // When the video's load progress is updated
  // Does not work in all browsers (Safari/Chrome 5)
  onProgress: function(event){
    if(event.total > 0) {
      this.setLoadProgress(event.loaded / event.total);
    }
  },
  // Buffer watching method for load progress.
  // Used for browsers that don't support the progress event
  updateBufferedTotal: function(){
    if (this.video.buffered) {
      if (this.video.buffered.length >= 1) {
        this.setLoadProgress(this.video.buffered.end(0) / this.video.duration);
        if (this.video.buffered.end(0) == this.video.duration) {
          clearInterval(this.watchBuffer);
        }
      }
    } else {
      clearInterval(this.watchBuffer);
    }
  },
  setLoadProgress: function(percentAsDecimal){
    if (percentAsDecimal > this.percentLoaded) {
      this.percentLoaded = percentAsDecimal;
      this.updateLoadProgress();
    }
  },
  updateLoadProgress: function(){
    if (this.controls.style.display == 'none') { return; }
    this.loadProgress.style.width = (this.percentLoaded * (_V_.getComputedStyleValue(this.progressHolder, "width").replace("px", ""))) + "px";
  },

  /* Volume
  ================================================================================ */
  onVolumeChange: function(event){ this.updateVolumeDisplay(); },
  // Adjust the volume when the user drags on the volume control
  onVolumeControlMouseDown: function(event){
    _V_.blockTextSelection();
    this.setVolumeWithEvent(event);
    document.addEventListener("mousemove", this.onVolumeMouseMove, false);
    document.addEventListener("mouseup", this.onVolumeMouseUp, false);
  },
  onVolumeMouseMove: function(event){
    this.setVolumeWithEvent(event);
  },
  onVolumeMouseUp: function(event){
    _V_.unblockTextSelection();
    document.removeEventListener("mousemove", this.onVolumeMouseMove, false);
    document.removeEventListener("mouseup", this.onVolumeMouseUp, false);
  },
  // When the user stops dragging, set a new volume
  // Backup for when the user only clicks and doesn't drag
  onVolumeControlMouseUp: function(event){
    this.setVolumeWithEvent(event);
  },

  // Set a new volume based on where the user clicked on the volume control
  setVolume: function(newVol){
    this.video.volume = parseFloat(newVol);
    localStorage.volume = this.video.volume;
  },

  setVolumeWithEvent: function(event){
    var newVol = _V_.getRelativePosition(event.pageX, this.volumeControl.children[0]);
    this.setVolume(newVol);
  },

  // Update the volume control display
  // Unique to these default controls. Uses borders to create the look of bars.
  updateVolumeDisplay: function(){
    var volNum = Math.ceil(this.video.volume * 6);
    for(var i=0; i<6; i++) {
      if (i < volNum) {
        _V_.addClass(this.volumeDisplay.children[i], "vjs-volume-level-on");
      } else {
        _V_.removeClass(this.volumeDisplay.children[i], "vjs-volume-level-on");
      }
    }
  },

  /* Fullscreen / Full-window
  ================================================================================ */
  // When the user clicks on the fullscreen button, update fullscreen setting
  onFullscreenControlClick: function(event){
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
      document.addEventListener("keydown", this.onEscKey, false);
      // Add listener for a window resize
      window.addEventListener("resize", this.onWindowResize, false);
      // Hide any scroll bars
      document.documentElement.style.overflow = 'hidden';
      // Apply fullscreen styles
      _V_.addClass(this.box, "vjs-fullscreen");
      // Resize the box, controller, and poster
      this.positionBox();
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
          if (e.code == 11) { this.errors.push(VideoJS.errorCodes.videoNotReady); }
        }
        return true;
      }
    }
  },
  // Turn off fullscreen (window) mode
  fullscreenOff: function(){
    this.videoIsFullScreen = false;
    document.removeEventListener("keydown", this.onEscKey, false);
    window.removeEventListener("resize", this.onWindowResize, false);
    // Unhide scroll bars.
    document.documentElement.style.overflow = this.docOrigOverflow;
    // Remove fullscreen styles
    _V_.removeClass(this.box, "vjs-fullscreen");
    // Resize the box, controller, and poster to original sizes
    this.positionBox();
  },
  onWindowResize: function(event){ // Removeable
    this.positionControlBar();
  },
  // Create listener for esc key while in full screen mode
  onEscKey: function(event){ // Removeable
    if (event.keyCode == 27) {
      this.fullscreenOff();
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
    this.video.parentNode.appendChild(this.bigPlayButton);
    this.initializeBigPlayButton();
  },
  initializeBigPlayButton: function(){
    this.bigPlayButton.addEventListener("click", this.onPlayControlClick.context(this), false);
    this.video.addEventListener("play", this.bigPlayButtonOnPlay.context(this), false);
    this.video.addEventListener("ended", this.bigPlayButtonOnEnded.context(this), false);
  },
  showBigPlayButton: function(){ this.bigPlayButton.style.display = "block"; },
  hideBigPlayButton: function(){ this.bigPlayButton.style.display = "none"; },
  bigPlayButtonOnPlay: function(event){ this.hideBigPlayButton(); },
  bigPlayButtonOnEnded: function(event){ this.showBigPlayButton(); },

  /* Spinner (Loading)
  ================================================================================ */
  buildSpinner: function(){
    this.spinner = _V_.createElement("div", {
      className: "vjs-spinner",
      innerHTML: "<div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>"
    });
    this.video.parentNode.appendChild(this.spinner);
    this.initializeSpinner();
  },
  initializeSpinner: function(){
    this.video.addEventListener("loadeddata", this.spinnerOnLoadedData.context(this), false);
    this.video.addEventListener("loadstart", this.spinnerOnLoadStart.context(this), false);
    this.video.addEventListener("seeking", this.spinnerOnSeeking.context(this), false);
    this.video.addEventListener("seeked", this.spinnerOnSeeked.context(this), false);
    this.video.addEventListener("canplay", this.spinnerOnCanPlay.context(this), false);
    this.video.addEventListener("canplaythrough", this.spinnerOnCanPlayThrough.context(this), false);
    this.video.addEventListener("waiting", this.spinnerOnWaiting.context(this), false);
    this.video.addEventListener("stalled", this.spinnerOnStalled.context(this), false);
    this.video.addEventListener("suspend", this.spinnerOnSuspend.context(this), false);
    this.video.addEventListener("playing", this.spinnerOnPlaying.context(this), false);
    this.video.addEventListener("timeupdate", this.spinnerOnTimeUpdate.context(this), false);
  },
  showSpinner: function(){
    this.spinner.style.display = "block";
    clearInterval(this.spinnerInterval);
    this.spinnerInterval = setInterval(function(){ this.rotateSpinner(); }.context(this), 100);
  },
  hideSpinner: function(){
    this.spinner.style.display = "none";
    clearInterval(this.spinnerInterval);
  },
  spinnerRotated: 0,
  rotateSpinner: function(){
    // this.spinner.style.transform =       'scale(0.5) rotate('+this.spinnerRotated+'deg)';
    this.spinner.style.WebkitTransform = 'scale(0.5) rotate('+this.spinnerRotated+'deg)';
    this.spinner.style.MozTransform =    'scale(0.5) rotate('+this.spinnerRotated+'deg)';
    if (this.spinnerRotated == 360) { this.spinnerRotated = 0; }
    this.spinnerRotated += 45;
  },
  spinnerOnLoadedData: function(event){ this.hideSpinner(); },
  spinnerOnLoadStart: function(event){ this.showSpinner(); },
  spinnerOnSeeking: function(event){ /* this.showSpinner(); */ },
  spinnerOnSeeked: function(event){ /* this.hideSpinner(); */ },
  spinnerOnCanPlay: function(event){ /* this.hideSpinner(); */ },
  spinnerOnCanPlayThrough: function(event){ this.hideSpinner(); },
  spinnerOnWaiting: function(event){
    // Safari sometimes triggers waiting inappropriately
    // Like after video has played, any you play again.
    this.showSpinner();
  },
  spinnerOnStalled: function(event){},
  spinnerOnSuspend: function(event){},
  spinnerOnPlaying: function(event){ this.hideSpinner(); },
  spinnerOnTimeUpdate: function(event){
    // Safari sometimes calls waiting and doesn't recover
    if(this.spinner.style.display == "block") { this.hideSpinner(); }
  },

  /* Styles Check - Check if styles are loaded
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

  /* Poster Image
  ================================================================================ */
  buildPoster: function(){
    this.updatePosterSource();
    if (this.video.poster) {
      this.poster = document.createElement("img");
      // Add poster to video box
      this.video.parentNode.appendChild(this.poster);

      // Add poster image data
      this.poster.src = this.video.poster;
      // Add poster styles
      this.poster.className = "vjs-poster";
      this.initializePoster();
    } else {
      this.poster = false;
    }
  },
  initializePoster: function(){
    if (this.poster) {
      // Listen for the mouse move the poster image. Used to reveal the controller.
      this.poster.addEventListener("mousemove", this.onVideoMouseMove.context(this), false);
      // Listen for the mouse moving out of the poster image. Used to hide the controller.
      this.poster.addEventListener("mouseout", this.onVideoMouseOut.context(this), false);
      // Make a click on the poster act like a click on the play button.
      this.poster.addEventListener("click", this.onPlayControlClick.context(this), false);
      // Hide/Show poster on video events
      this.video.addEventListener("play", this.posterOnPlay.context(this), false);
      this.video.addEventListener("ended", this.posterOnEnded.context(this), false);
    }
  },
  // Add the video poster to the video's container, to fix autobuffer/preload bug
  showPoster: function(){
    if (!this.poster) { return; }
    this.poster.style.display = "block";
    this.positionPoster();
  },
  // Size the poster image
  positionPoster: function(){
    // Only if the poster is visible
    if (!this.poster || this.poster.style.display == 'none') { return; }
    this.poster.style.height = this.video.offsetHeight + "px";
    this.poster.style.width = this.video.offsetWidth + "px";
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
  },
  posterOnEnded: function(){ this.showPoster(); },
  posterOnPlay: function(){ this.hidePoster(); },

  /* Subtitles
  ================================================================================ */
  getSubtitles: function(){
    var tracks = this.video.getElementsByTagName("TRACK");
    for (var i=0,j=tracks.length; i<j; i++) {
      if (tracks[i].getAttribute("kind") == "subtitles") {
        this.subtitlesSource = tracks[i].getAttribute("src");
      }
    }
    if (this.subtitlesSource !== undefined) {
      this.loadSubtitles();
      this.buildSubtitles();
    }
  },

  loadSubtitles: function() {
    _V_.get(this.subtitlesSource, this.parseSubtitles.context(this));
  },

  parseSubtitles: function(subText) {
    var lines = subText.replace("\r",'').split("\n");
    this.subtitles = [];
    this.currentSubtitlePosition = 0;

    var i = 0;
    while(i<lines.length) {
      // define the current subtitle object
      var subtitle = {};
      // get the number
      subtitle.id = lines[i++];
      if (!subtitle.id) {
        break;
      }

      // get time
      var time = lines[i++].split(" --> ");
      subtitle.startTime = this.parseSubtitleTime(time[0]);
      subtitle.endTime = this.parseSubtitleTime(time[1]);

      // get subtitle text
      var text = [];
      while(lines[i].length>0 && lines[i]!="\r") {
        text.push(lines[i++]);
      }
      subtitle.text = text.join('<br/>');

      // add this subtitle
      this.subtitles.push(subtitle);

      // ignore the blank line
      i++;
    }
  },

  parseSubtitleTime: function(timeText) {
    var parts = timeText.split(':');
    var time = 0;
    // hours => seconds
    time += parseFloat(parts[0])*60*60;
    // minutes => seconds
    time += parseFloat(parts[1])*60;
    // get seconds
    var seconds = parts[2].split(',');
    time += parseFloat(seconds[0]);
    // add miliseconds
    time = time + parseFloat(seconds[1])/1000;
    return time;
  },

  buildSubtitles: function(){
    /* Creating this HTML
      <div class="vjs-subtitles"></div>
    */
    this.subtitlesDiv = _V_.createElement("div", { className: 'vjs-subtitles' });
    this.box.appendChild(this.subtitlesDiv);
    this.initializeSubtitles();
  },

  initializeSubtitles: function(){
    this.video.addEventListener('timeupdate', this.subtitlesOnTimeUpdate.context(this), false);
  },

  subtitlesOnTimeUpdate: function(){
    // show the subtitles
    if (this.subtitles) {
      var x = this.currentSubtitlePosition;

      while (x<this.subtitles.length && this.video.currentTime>this.subtitles[x].endTime) {
        if (this.subtitles[x].showing) {
          this.subtitles[x].showing = false;
          this.subtitlesDiv.innerHTML = "";
        }
        this.currentSubtitlePosition++;
        x = this.currentSubtitlePosition;
      }

      if (this.currentSubtitlePosition>=this.subtitles.length) { return; }

      if (this.video.currentTime>=this.subtitles[x].startTime && this.video.currentTime<=this.subtitles[x].endTime) {
        this.subtitlesDiv.innerHTML = this.subtitles[x].text;
        this.subtitles[x].showing = true;
      }
    }
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

  /* Using Default Controls for iPad now. Can't do native fullscreen through the iPad API */
  // For iPads, controls need to always show because there's no hover
  // The controls also have to be below for the full-window mode to work.
  // iPadFix: function(){
  //   this.options.controlsBelow = true;
  //   this.options.controlsHiding = false;
  // },

  history: [],
  log: function(event){
    if (!event) { return; }
    if (typeof event == "string") { event = { type: event }; }
    if (event.type) { this.history.push(event.type); }
    if (this.history.length >= 50) { this.history.shift(); }
    if (this.options.debug === true) { console.log(event.type); }
  },

  /* Flash Object Fallback
  ================================================================================ */
  // Get Flash Fallback object element from Embed Code
  getFlashObject: function(){
    var objects = this.video.getElementsByTagName("OBJECT");
    for (var i=0,j=objects.length; i<j; i++) {
      if (objects[i].className == "vjs-flash-fallback") {
        return  objects[i];
      }
    }
  },
  replaceWithFlash: function(){
    // this.flashObject = this.video.removeChild(this.flashObject);
    if (this.flashObject) {
      this.box.insertBefore(this.flashObject, this.video);
      this.video.style.display = "none"; // Removing it was breaking later players
    }
  },
  // Check if browser can use this flash player
  flashVersionSupported: function(){ return VideoJS.getFlashVersion() >= this.options.flashVersion; },

  /* Download Links Fallback
  ================================================================================ */
  // Get the download links block element
  getLinksFallback: function(){ return this.box.getElementsByTagName("P")[0]; },
  // Hide no-video download paragraph
  hideLinksFallback: function(){
    if (this.options.linksHiding && this.linksFallback) { this.linksFallback.style.display = "none"; }
  },
  // Hide no-video download paragraph
  showLinksFallback: function(){
    if (this.linksFallback) { this.linksFallback.style.display = "block"; }
  },

  /* Player API - Translate functionality from player to video
  ================================================================================ */
  play: function(){ this.video.play(); },
  pause: function(){ this.video.pause(); },
  width: function(width){
    this.video.width = width;
    this.box.width = width;
    // Width isn't working for the poster
    this.poster.style.width = width+"px";
    this.positionControlBar();
    return this;
  },
  height: function(height){
    this.video.height = height;
    this.box.height = height;
    this.poster.style.height = height+"px";
    this.positionControlBar();
    return this;
  },
  volume: function(newVolume){
    if (newVolume !== undefined) { this.setVolume(newVolume); }
    return this.video.volume;
  }
});

////////////////////////////////////////////////////////////////////////////////
// Convenience Functions (mini library)
// Functions not specific to video or VideoJS and could probably be replaced with a library like jQuery
////////////////////////////////////////////////////////////////////////////////
var _V_ = {
  addClass: function(element, classToAdd){
    if (element.className.split(/\s+/).lastIndexOf(classToAdd) == -1) { element.className = element.className === "" ? classToAdd : element.className + " " + classToAdd; }
  },

  removeClass: function(element, classToRemove){
    if (element.className.indexOf(classToRemove) == -1) { return; }
    var classNames = element.className.split(/\s+/);
    classNames.splice(classNames.lastIndexOf(classToRemove),1);
    element.className = classNames.join(" ");
  },

  merge: function(obj1, obj2){
    for(var attrname in obj2){
      if (obj2.hasOwnProperty(attrname)) {
        obj1[attrname]=obj2[attrname];
      }
    }
    return obj1;
  },

  createElement: function(tagName, attributes){
    return _V_.merge(document.createElement(tagName), attributes);
  },

  // Attempt to block the ability to select text while dragging controls
  blockTextSelection: function(){
    document.body.focus();
    document.onselectstart = function () { return false; };
  },

  // Turn off text selection blocking
  unblockTextSelection: function(){
    document.onselectstart = function () { return true; };
  },

  // Return seconds as MM:SS
  formatTime: function(secs) {
    var seconds = Math.round(secs);
    var minutes = Math.floor(seconds / 60);
    minutes = (minutes >= 10) ? minutes : "0" + minutes;
    seconds = Math.floor(seconds % 60);
    seconds = (seconds >= 10) ? seconds : "0" + seconds;
    return minutes + ":" + seconds;
  },

  // Return the relative horizonal position of an event as a value from 0-1
  getRelativePosition: function(x, relativeElement){
    return Math.max(0, Math.min(1, (x - _V_.findPosX(relativeElement)) / relativeElement.offsetWidth));
  },

  // Get an objects position on the page
  findPosX: function(obj) {
    var curleft = obj.offsetLeft;
    while(obj = obj.offsetParent) {
      curleft += obj.offsetLeft;
    }
    return curleft;
  },

  getComputedStyleValue: function(element, style){
    return window.getComputedStyle(element, null).getPropertyValue(style);
  },

  get: function(url, onSuccess){
    if (typeof XMLHttpRequest == "undefined") {
      XMLHttpRequest = function () {
        try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); } catch (e) {}
        try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); } catch (f) {}
        try { return new ActiveXObject("Msxml2.XMLHTTP"); } catch (g) {}
        //Microsoft.XMLHTTP points to Msxml2.XMLHTTP.3.0 and is redundant
        throw new Error("This browser does not support XMLHttpRequest.");
      };
    }
    var request = new XMLHttpRequest();
    request.open("GET",url);
    request.onreadystatechange = function() {
      if (request.readyState == 4 && request.status == 200) {
        onSuccess(request.responseText);
      }
    }.context(this);
    request.send();
  },

  // DOM Ready functionality adapted from jQuery. http://jquery.com/
  bindDOMReady: function(){
    if (document.readyState === "complete") {
      return _V_.DOMReady();
    }
    if (document.addEventListener) {
      document.addEventListener("DOMContentLoaded", _V_.DOMContentLoaded, false);
      window.addEventListener("load", _V_.DOMReady, false);
    } else if (document.attachEvent) {
      document.attachEvent("onreadystatechange", _V_.DOMContentLoaded);
      window.attachEvent("onload", _V_.DOMReady);
    }
  },

  DOMContentLoaded: function(){
    if (document.addEventListener) {
      document.removeEventListener( "DOMContentLoaded", _V_.DOMContentLoaded, false);
      _V_.DOMReady();
    } else if ( document.attachEvent ) {
      if ( document.readyState === "complete" ) {
        document.detachEvent("onreadystatechange", _V_.DOMContentLoaded);
        _V_.DOMReady();
      }
    }
  },

  // Functions to be run once the DOM is loaded
  DOMReadyList: [],
  addToDOMReady: function(fn){
    if (_V_.DOMIsReady) {
      fn.call(document);
    } else {
      _V_.DOMReadyList.push(fn);
    }
  },

  DOMIsReady: false,
  DOMReady: function(){
    if (_V_.DOMIsReady) { return; }
    if (!document.body) { return setTimeout(_V_.DOMReady, 13); }
    _V_.DOMIsReady = true;
    if (_V_.DOMReadyList) {
      for (var i=0; i<_V_.DOMReadyList.length; i++) {
        _V_.DOMReadyList[i].call(document);
      }
      _V_.DOMReadyList = null;
    }
  }
};
_V_.bindDOMReady();

////////////////////////////////////////////////////////////////////////////////
// Class Methods
// Functions that don't apply to individual videos.
////////////////////////////////////////////////////////////////////////////////

VideoJS.players = {
  html5: {
    init: function(){
      if (VideoJS.browserSupportsVideo() && this.canPlaySource()) {
        this.html5Init();
        return true;
      } else {
        return false;
      }
    }
  },

  flashObject: {
    init: function(){
      // Check if object exists & Flash Player version is supported
      if (this.flashObject && this.flashVersionSupported()) {
        this.replaceWithFlash();
        return true;
      } else {
        return false;
      }
    }
  },

  links: {
    init: function(){
      this.showLinksFallback();
      return true;
    }
  }
}

// Add VideoJS to all video tags with the video-js class when the DOM is ready
VideoJS.setupAllWhenReady = function(options){
  // Options is stored globally, and added ot any new player on init
  VideoJS.options = options;
  VideoJS.DOMReady(VideoJS.setup);
};

// Run the supplied function when the DOM is ready
VideoJS.DOMReady = function(fn){
  _V_.addToDOMReady(fn);
};

// Set up a specific video or array of video elements
// "video" can be:
//    false, undefined, or "All": set up all videos with the video-js class
//    A video tag ID or video tag element: set up one video and return one player
//    An array of video tag elements/IDs: set up each and return an array of players
VideoJS.setup = function(videos, options){

  var returnSingular = false,
  playerList = [],
  videoElement;

  // If videos is undefined or "All", set up all videos with the video-js class
  if (!videos || videos == "All") {
    videos = VideoJS.getVideoJSTags();
  // If videos is not an array, add to an array
  } else if (typeof videos != 'object' || videos.nodeType == 1) {
    videos = [videos];
    returnSingular = true;
  }

  // Loop through videos and create players for them
  for (var i=0; i<videos.length; i++) {
    if (typeof videos[i] == 'string') {
      videoElement = document.getElementById(videos[i]);
    } else { // assume DOM object
      videoElement = videos[i];
    }
    playerList.push(new VideoJS(videoElement, options));
  }

  // Return one or all depending on what was passed in
  return (returnSingular) ? playerList[0] : playerList;
};

// Find video tags with the video-js class
VideoJS.getVideoJSTags = function() {
  var videoTags = document.getElementsByTagName("video"),
  videoJSTags = [], videoTag;

  for (var i=0,j=videoTags.length; i<j; i++) {
    videoTag = videoTags[i];
    if (videoTag.className.indexOf("video-js") != -1) {
      videoJSTags.push(videoTag);
    }
  }

  return videoJSTags;
};

// Check if the browser supports video.
VideoJS.browserSupportsVideo = function() {
  if (typeof VideoJS.videoSupport != "undefined") { return VideoJS.videoSupport; }
  VideoJS.videoSupport = !!document.createElement('video').canPlayType;
  return VideoJS.videoSupport;
};

VideoJS.getFlashVersion = function(){
  // Cache Version
  if (typeof VideoJS.flashVersion != "undefined") { return VideoJS.flashVersion; }
  var version = 0, desc;
  if (typeof navigator.plugins != "undefined" && typeof navigator.plugins["Shockwave Flash"] == "object") {
    desc = navigator.plugins["Shockwave Flash"].description;
    if (desc && !(typeof navigator.mimeTypes != "undefined" && navigator.mimeTypes["application/x-shockwave-flash"] && !navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin)) {
      version = parseInt(desc.match(/^.*\s+([^\s]+)\.[^\s]+\s+[^\s]+$/)[1], 10);
    }
  } else if (typeof window.ActiveXObject != "undefined") {
    try {
      var testObject = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
      if (testObject) {
        version = parseInt(testObject.GetVariable("$version").match(/^[^\s]+\s(\d+)/)[1], 10);
      }
    }
    catch(e) {}
  }
  VideoJS.flashVersion = version;
  return VideoJS.flashVersion;
};

// Browser & Device Checks
VideoJS.isIE = function(){ return !+"\v1"; };
VideoJS.isIPad = function(){ return navigator.userAgent.match(/iPad/i) !== null; };
VideoJS.isIPhone = function(){ return navigator.userAgent.match(/iPhone/i) !== null; };
VideoJS.isIOS = function(){ return VideoJS.isIPhone() || VideoJS.isIPad(); };
VideoJS.iOSVersion = function() {
  var match = navigator.userAgent.match(/OS (\d+)_/i);
  if (match && match[1]) { return match[1]; }
};
VideoJS.isAndroid = function(){ return navigator.userAgent.match(/Android/i) !== null; };
VideoJS.androidVersion = function() {
  var match = navigator.userAgent.match(/Android (\d+)\./i);
  if (match && match[1]) { return match[1]; }
};

VideoJS.errorCodes = {
  // Safari errors if you call functions on a video that hasn't loaded yet
  videoNotReady: "Video is not ready yet (try playing the video first)."
};

// Allows for binding context to functions
// when using in event listeners and timeouts
Function.prototype.context = function(obj){
  var method = this, temp;
  temp = function(){
    return method.apply(obj, arguments);
  };
  return temp;
};

// Shim to make Video tag valid in IE
if(VideoJS.isIE()) { document.createElement("video"); }

// jQuery Plugin
if (window.jQuery) {
  (function($) {
    $.fn.VideoJS = function(options) {
      this.each(function() {
        VideoJS.setup(this, options);
      });
      return this;
    };
    $.fn.player = function() {
      return this[0].player;
    };
  })(jQuery);
}



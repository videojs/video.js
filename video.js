/*
VideoJS - HTML5 Video Player
v1.2.0

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

// Self-executing function to prevent global vars and help with minification
(function(window, undefined){
  var document = window.document;

// Video JS Player Class
var VideoJS = _V_ = JRClass.extend({

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
      flashIsDominant: false, // Always use Flash when available
      useBuiltInControls: false, // Dont' use the video JS controls (iPhone)
      playerFallbackOrder: ["html5", "flashObject", "links"] // Players and order to use them
    };
    // Override default options with global options
    if (typeof VideoJS.options == "object") { _V_.merge(this.options, VideoJS.options); }
    // Override default & global options with options specific to this player
    if (typeof setOptions == "object") { _V_.merge(this.options, setOptions); }

    // Store reference to embed code pieces
    this.box = this.video.parentNode;
    this.linksFallback = this.getLinksFallback();
    this.hideLinksFallback(); // Will be shown again if "links" player is used
    this.flashObject = this.getFlashObject();

    // Make Flash first player in line
    if (this.options.flashIsDominant) { this.options.players.unshift("flashObject") }

    // Loop through the player names list in options, "html5" etc.
    // For each player name, initialize the player with that name under VideoJS.players
    // If the player successfully initializes, we're done
    // If not, try the next player in the list
    this.each(this.options.playerFallbackOrder, function(playerType){
      var playerSupported = (VideoJS.playerTypes[playerType].init.context(this))();
      return playerSupported;
    });
  },

  html5Init: function(){
    this.fixPreloading(); // Support old browsers that used autobuffer
    this.loaded(0); // Store amount of video loaded

    // Set to stored volume OR 85%
    this.volume(localStorage.volume || this.options.defaultVolume);

    if (VideoJS.isIOS()) {
      this.options.useBuiltInControls = true;
      this.iOSInterface();
    }

    if (VideoJS.isAndroid()) {
      this.options.useBuiltInControls = true;
      this.androidInterface();
    }

    this.activateElement(this.video, "video");

    // Add VideoJS Controls
    if (!this.options.useBuiltInControls) {
      this.video.controls = false;

      if (this.options.controlsBelow) { _V_.addClass(this.box, "vjs-controls-below"); }

      // Build Interface
      this.buildStylesCheckDiv(); // Used to check if style are loaded
      this.buildAndActivatePoster();
      this.buildAndActivateBigPlayButton();
      this.buildAndActivateSpinner();
      this.buildAndActivateControlBar();
      this.loadInterface(); // Show everything once styles are loaded
      this.getSubtitles();
    }
  },

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
    if (this.video.paused !== false) { this.showBigPlayButton(); }
    if (this.options.showControlsAtStart) { this.showControlBars(); }
    this.positionAll();
  },

  /* Behaviors
  ================================================================================ */
  behaviors: {},
  newBehavior: function(name, activate, functions){
    this.behaviors[name] = activate;
    this.extend(functions);
  },
  activateElement: function(element, behavior){
    this.behaviors[behavior].call(this, element);
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
      if (this.options.controlsBelow) {
        this.box.style.height = "";
        this.video.style.height = (this.box.offsetHeight - this.controls.offsetHeight) + "px";
      }
    } else {
      this.box.style.width = this.video.offsetWidth + "px";
      if (this.options.controlsBelow) {
        this.video.style.height = "";
        // this.box.style.height = this.video.offsetHeight + this.controls.offsetHeight + "px";
      }
    }
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

    // Set up containing box with behaviors
    _V_.addClass(this.box, "vjs-paused");
    this.activateElement(this.box, "mouseOverVideoReporter");

    // Create a div to hold the different controls
    this.controls = _V_.createElement("div", { className: "vjs-controls" });
    // Add the controls to the video's container
    this.video.parentNode.appendChild(this.controls);
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

  /* Errors/Warnings
  ================================================================================ */
  errors: [], // Array to track errors
  warnings: [],
  warning: function(warning){
    this.warnings.push(warning);
    this.log(warning);
  },

  /* Big Play Button
  ================================================================================ */
  buildAndActivateBigPlayButton: function(){
    this.buildBigPlayButton();
    this.activateBigPlayButton();
  },
  buildBigPlayButton: function(){
    /* Creating this HTML
      <div class="vjs-big-play-button"><span></span></div>
    */
    this.bigPlayButton = _V_.createElement("div", {
      className: "vjs-big-play-button",
      innerHTML: "<span></span>"
    });
    this.video.parentNode.appendChild(this.bigPlayButton);
  },
  activateBigPlayButton: function(){
    this.activateElement(this.bigPlayButton, "playToggle");
    this.video.addEventListener("play", this.bigPlayButtonOnPlay.context(this), false);
    this.video.addEventListener("ended", this.bigPlayButtonOnEnded.context(this), false);
  },
  showBigPlayButton: function(){ this.bigPlayButton.style.display = "block"; },
  hideBigPlayButton: function(){ this.bigPlayButton.style.display = "none"; },
  bigPlayButtonOnPlay: function(event){ this.hideBigPlayButton(); },
  bigPlayButtonOnEnded: function(event){ this.showBigPlayButton(); },

  /* Spinner (Loading)
  ================================================================================ */
  buildAndActivateSpinner: function(){
    this.spinner = _V_.createElement("div", {
      className: "vjs-spinner",
      innerHTML: "<div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>"
    });
    this.video.parentNode.appendChild(this.spinner);
    this.activateSpinner();
  },
  activateSpinner: function(){
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
    this.spinnerInterval = setInterval(this.rotateSpinner.context(this), 100);
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
  buildAndActivatePoster: function(){
    this.updatePosterSource();
    if (this.video.poster) {
      this.poster = document.createElement("img");
      // Add poster to video box
      this.video.parentNode.appendChild(this.poster);

      // Add poster image data
      this.poster.src = this.video.poster;
      // Add poster styles
      this.poster.className = "vjs-poster";
      this.activatePoster();
    } else {
      this.poster = false;
    }
  },
  activatePoster: function(){
    // Listen for the mouse move the poster image. Used to reveal the controller.
    this.poster.addEventListener("mousemove", this.onVideoMouseMove.context(this), false);
    // Listen for the mouse moving out of the poster image. Used to hide the controller.
    this.poster.addEventListener("mouseout", this.onVideoMouseOut.context(this), false);
    // Make a click on the poster act like a click on the play button.
    this.activateElement(this.poster, "playButton");
    // Hide/Show poster on video events
    this.video.addEventListener("play", this.posterOnPlay.context(this), false);
    this.video.addEventListener("ended", this.posterOnEnded.context(this), false);
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
  },
  posterOnEnded: function(){ this.showPoster(); },
  posterOnPlay: function(){ this.hidePoster(); },

  /* Subtitles
  ================================================================================ */
  getSubtitles: function(){
    var tracks = this.video.getElementsByTagName("TRACK");
    for (var i=0,j=tracks.length; i<j; i++) {
      if (tracks[i].getAttribute("kind") == "subtitles") { this.subtitlesSource = tracks[i].getAttribute("src"); }
    }
    if (this.subtitlesSource !== undefined) {
      this.loadSubtitles();
      this.buildSubtitles();
    }
  },
  loadSubtitles: function() { _V_.get(this.subtitlesSource, this.parseSubtitles.context(this)); },
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
    this.activateSubtitles();
  },

  activateSubtitles: function(){
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
    this.video.addEventListener("click", function(){ this.play(); }, false); // Required to play
    this.buildBigPlayButton(); // But don't activate the normal way. Pause doesn't work right on android.
    this.bigPlayButton.addEventListener("click", function(){ this.video.play(); }.context(this), false);
    this.positionBox();
    this.showBigPlayButton();
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
  // Used to force a browser to fall back when it's an HTML5 browser but there's no supported sources
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
    if (this.linksFallback) { this.linksFallback.style.display = "none"; }
  },
  // Hide no-video download paragraph
  showLinksFallback: function(){
    if (this.linksFallback) { this.linksFallback.style.display = "block"; }
  },

  /* History of errors/events (not quite there yet)
  ================================================================================ */
  history: [],
  log: function(event){
    if (!event) { return; }
    if (typeof event == "string") { event = { type: event }; }
    if (event.type) { this.history.push(event.type); }
    if (this.history.length >= 50) { this.history.shift(); }
    try { console.log(event.type); } catch(e) { try { opera.postError(event.type); } catch(e){} }
  },

  /* Local Storage
  ================================================================================ */
  setLocalStorage: function(key, value){
    try { localStorage[key] = value; }
    catch(e) {
      if (e.code == 22 || e.code == 1014) { // Webkit == 22 / Firefox == 1014
        this.warning(VideoJS.warnings.localStorageFull);
      }
    }
  },

  /* Player API - Translate functionality from player to video
  ================================================================================ */
  values: {}, // Storage for setters and getters of the same name.
  play: function(){ this.video.play(); },
  pause: function(){ this.video.pause(); },
  currentTime: function(seconds){
    if (seconds !== undefined) { 
      this.video.currentTime = seconds;
      this.values.currentTime = seconds;
      this.onCurrentTimeUpdate();
    }
    // Allow for smoother scrubbing by repoting back stored value
    if (this.values.currentTime) { return this.values.currentTime; }
    return this.video.currentTime;
  },
  duration: function(val){ 
    return this.video.duration; 
  },
  playProgress: function(percentAsDecimal){
    if (percentAsDecimal !== undefined) { 
      this.values.playProgress = percentAsDecimal; 
      this.onPlayProgressUpdate();
    }
    if (!this.values.playProgress) { this.values.playProgress = 0; }
    return this.values.playProgress;
  },
  loaded: function(percentAsDecimal){
    if (percentAsDecimal !== undefined && percentAsDecimal > this.values.loaded) {
      this.values.loaded = percentAsDecimal
      this.updateLoadProgress();
    }
    if (!this.values.loaded) { this.values.loaded = 0; }
    return this.values.loaded;
  },
  volume: function(percentAsDecimal){
    if (percentAsDecimal !== undefined) {
      this.values.volume = parseFloat(percentAsDecimal);
      this.video.volume = this.values.volume;
      this.setLocalStorage("volume", this.video.volume);
    }
    if (this.values.volume) { return this.values.volume; }
    return this.video.volume;
  },
  width: function(width){
    this.video.width = width;
    this.box.width = width;
    // Width isn't working for the poster
    this.poster.style.width = width+"px";
    this.positionControlBars();
    return this;
  },
  height: function(height){
    this.video.height = height;
    this.box.height = height;
    this.poster.style.height = height+"px";
    this.positionControlBars();
    return this;
  },

  /* Helpers
  ================================================================================ */
  // Each that that mains player as context
  // Break if true is returned
  each: function(arr, fn){
    for (var i=0,j=arr.length; i<j; i++) { 
      if (fn.call(this, arr[i], i)) { break; }
    }
  },

  extend: function(obj){
    for (var attrname in obj) {
      if (obj.hasOwnProperty(attrname)) { this[attrname]=obj[attrname]; }
    }
  }
});
VideoJS.player = VideoJS.prototype;

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

    /* Time Tracking -------------------------------------------------------------- */
    stopTrackingBuffered: function(){ clearInterval(this.bufferedInterval); },
    // Current Time Tracking
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
      // currentTime changed, reset subtitles
      // if (!this.subtitles) { this.currentSubtitlePosition = 0; }
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
        if (bar.style) { bar.style.width = _V_.round(this.playProgress() * 100) + "%"; }
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
        if (bar.style) { bar.style.width = parseInt(this.loaded() * 100) + "%"; }
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
    },
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
        document.addEventListener("keydown", this.onFullscreenEscKey.rEvtContext(this), false);
        // Add listener for a window resize
        window.addEventListener("resize", this.onFullscreenWindowResize.rEvtContext(this), false);
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
      document.removeEventListener("keydown", this.onFullscreenEscKey, false);
      window.removeEventListener("resize", this.onFullscreenWindowResize, false);
      // Unhide scroll bars.
      document.documentElement.style.overflow = this.docOrigOverflow;
      // Remove fullscreen styles
      _V_.removeClass(this.box, "vjs-fullscreen");
      // Resize the box, controller, and poster to original sizes
      this.positionAll();
    },
    onFullscreenWindowResize: function(event){ // Removeable
      this.positionControlBars();
    },
    // Create listener for esc key while in full screen mode
    onFullscreenEscKey: function(event){ // Removeable
      if (event.keyCode == 27) {
        this.fullscreenOff();
      }
    }
  }
);

////////////////////////////////////////////////////////////////////////////////
// Class Methods
// Functions that don't apply to individual videos.
////////////////////////////////////////////////////////////////////////////////

VideoJS.playerTypes = {
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
        this.video.src = ""; // Stop video from downloading if HTML5 is still supported
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
  VideoJS.addToDOMReady(fn);
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

VideoJS.warnings = {
  // Safari errors if you call functions on a video that hasn't loaded yet
  videoNotReady: "Video is not ready yet (try playing the video first).",
  // Getting a QUOTA_EXCEEDED_ERR when setting local storage occasionally
  localStorageFull: "Local Storage is Full"
};

////////////////////////////////////////////////////////////////////////////////
// Convenience Functions (mini library)
// Functions not specific to video or VideoJS and could probably be replaced with a library like jQuery
////////////////////////////////////////////////////////////////////////////////

// Combine Objects - Use "safe" to protect from overwriting existing items
VideoJS.merge = function(obj1, obj2, safe){
  for (var attrname in obj2){
    if (obj2.hasOwnProperty(attrname) && (!safe || !obj1.hasOwnProperty(attrname))) { obj1[attrname]=obj2[attrname]; }
  }
  return obj1;
};
VideoJS.extend = function(obj){ this.merge(this, obj, true); }

VideoJS.extend({

  addClass: function(element, classToAdd){
    if (element.className.split(/\s+/).lastIndexOf(classToAdd) == -1) { element.className = element.className === "" ? classToAdd : element.className + " " + classToAdd; }
  },
  removeClass: function(element, classToRemove){
    if (element.className.indexOf(classToRemove) == -1) { return; }
    var classNames = element.className.split(/\s+/);
    classNames.splice(classNames.lastIndexOf(classToRemove),1);
    element.className = classNames.join(" ");
  },
  createElement: function(tagName, attributes){
    return this.merge(document.createElement(tagName), attributes);
  },

  // Attempt to block the ability to select text while dragging controls
  blockTextSelection: function(){
    document.body.focus();
    document.onselectstart = function () { return false; };
  },
  // Turn off text selection blocking
  unblockTextSelection: function(){ document.onselectstart = function () { return true; }; },

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
    return Math.max(0, Math.min(1, (x - this.findPosX(relativeElement)) / relativeElement.offsetWidth));
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

  round: function(num, dec) {
    if (!dec) { dec = 0; }
    return Math.round(num*Math.pow(10,dec))/Math.pow(10,dec);
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
      return VideoJS.onDOMReady();
    }
    if (document.addEventListener) {
      document.addEventListener("DOMContentLoaded", VideoJS.DOMContentLoaded, false);
      window.addEventListener("load", VideoJS.onDOMReady, false);
    } else if (document.attachEvent) {
      document.attachEvent("onreadystatechange", VideoJS.DOMContentLoaded);
      window.attachEvent("onload", VideoJS.onDOMReady);
    }
  },

  DOMContentLoaded: function(){
    if (document.addEventListener) {
      document.removeEventListener( "DOMContentLoaded", VideoJS.DOMContentLoaded, false);
      VideoJS.onDOMReady();
    } else if ( document.attachEvent ) {
      if ( document.readyState === "complete" ) {
        document.detachEvent("onreadystatechange", VideoJS.DOMContentLoaded);
        VideoJS.onDOMReady();
      }
    }
  },

  // Functions to be run once the DOM is loaded
  DOMReadyList: [],
  addToDOMReady: function(fn){
    if (VideoJS.DOMIsReady) {
      fn.call(document);
    } else {
      VideoJS.DOMReadyList.push(fn);
    }
  },

  DOMIsReady: false,
  onDOMReady: function(){
    if (VideoJS.DOMIsReady) { return; }
    if (!document.body) { return setTimeout(VideoJS.onDOMReady, 13); }
    VideoJS.DOMIsReady = true;
    if (VideoJS.DOMReadyList) {
      for (var i=0; i<VideoJS.DOMReadyList.length; i++) {
        VideoJS.DOMReadyList[i].call(document);
      }
      VideoJS.DOMReadyList = null;
    }
  }
});
VideoJS.bindDOMReady();

// Allows for binding context to functions
// when using in event listeners and timeouts
Function.prototype.context = function(obj){
  var method = this,
  temp = function(){
    return method.apply(obj, arguments);
  };
  return temp;
};

// Like context, in that it creates a closure
// But insteaad keep "this" intact, and passes the var as the second argument of the function
// Need for event listeners where you need to know what called the event
Function.prototype.evtContext = function(obj){
  var method = this,
  temp = function(){
    var origContext = this;
    return method.call(obj, arguments[0], origContext);
  };
  return temp;
};

// Removeable Event listener with Context
// Replaces the original function with a version that has context
// So it can be removed using the original function name.
// I have a feeling this one is gonna bite me in the butt some day
Function.prototype.rEvtContext = function(obj, funcParent){
  if (this.hasContext == true) { return this; }
  if (!funcParent) { funcParent = obj; }
  for (var attrname in funcParent) {
    if (funcParent[attrname] == this) {
      funcParent[attrname] = this.evtContext(obj);
      funcParent[attrname].hasContext = true;
      return funcParent[attrname];
    }
  }
  // Log function not found on object
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

// Expose to global
return (window.VideoJS = window._V_ = VideoJS);

// End self-executing function
})(window);

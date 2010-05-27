// Using jresig's Class implementation http://ejohn.org/blog/simple-javascript-inheritance/
(function(){var initializing=false, fnTest=/xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/; this.Class = function(){}; Class.extend = function(prop) { var _super = this.prototype; initializing = true; var prototype = new this(); initializing = false; for (var name in prop) { prototype[name] = typeof prop[name] == "function" && typeof _super[name] == "function" && fnTest.test(prop[name]) ? (function(name, fn){ return function() { var tmp = this._super; this._super = _super[name]; var ret = fn.apply(this, arguments); this._super = tmp; return ret; }; })(name, prop[name]) : prop[name]; } function Class() { if ( !initializing && this.init ) this.init.apply(this, arguments); } Class.prototype = prototype; Class.constructor = Class; Class.extend = arguments.callee; return Class;};})();

// Store a list of players on the page for reference by event listeners
var videoJSPlayers = new Array();

// Video JS Player Class
var VideoJS = Class.extend({

  // Initialize the player for the supplied video tag element
  // element: video tag
  // num: the current player's position in the videoJSPlayers array
  init: function(element, num){
    this.video = element;
    this.num = num;
    this.box = element.parentNode;

    this.buildController();
    this.showController();

    // Listen for when the video is played
    this.video.addEventListener("play", this.onPlay.context(this), false);
    // Listen for when the video is paused
    this.video.addEventListener("pause", this.onPause.context(this), false);
    // Listen for when the video ends
    this.video.addEventListener("ended", this.onEnded.context(this), false);
    // Listen for a volume change
    this.video.addEventListener('volumechange',this.onVolumeChange.context(this),false);
    // Listen for video errors
    this.video.addEventListener('error',this.onError.context(this),false);

    // Listen for clicks on the play/pause button
    this.playControl.addEventListener("click", this.onPlayControlClick.context(this), false);
    // Make a click on the video act like a click on the play button.
    this.video.addEventListener("click", this.onPlayControlClick.context(this), false);

    // Listen for drags on the progress bar
    this.progressHolder.addEventListener("mousedown", this.onProgressHolderMouseDown.context(this), false);
    // Listen for a release on the progress bar
    this.progressHolder.addEventListener("mouseup", this.onProgressHolderMouseUp.context(this), false);

    // Listen for a drag on the volume control
    this.volumeControl.addEventListener("mousedown", this.onVolumeControlMouseDown.context(this), false);
    // Listen for a release on the volume control
    this.volumeControl.addEventListener("mouseup", this.onVolumeControlMouseUp.context(this), false);
    // Set the display to the initial volume
    this.updateVolumeDisplay();

    // Listen for clicks on the button
    this.fullscreenControl.addEventListener("click", this.onFullscreenControlClick.context(this), false);

    // Listen for the mouse over the video. Used to reveal the controller.
    this.video.addEventListener("mouseover", this.onVideoMouseOver.context(this), false);
    // Listen for the mouse moving out of the video. Used to hide the controller.
    this.video.addEventListener("mouseout", this.onVideoMouseOut.context(this), false);
    // Have to add the mouseout to the controller too or it may not hide.
    // For some reason the same isn't needed for mouseover
    this.controls.addEventListener("mouseout", this.onVideoMouseOut.context(this), false);
  },

  buildController: function(){

    /* Creating this HTML
      <ul class="vjs-controls">
        <li class="vjs-play-control vjs-play">
          <span></span>
        </li>
        <li class="vjs-progress-control">
          <ul>
            <li class="vjs-progress-holder">
              <span class="vjs-load-progress"></span><span class="vjs-play-progress"></span>
            </li>
            <li class="vjs-progress-time">
              <span class="vjs-current-time-display">00:00</span><span> / </span><span class="vjs-duration-display">00:00</span>
            </li>
          </ul>
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
    this.controls = document.createElement("ul");

    // Add the controls to the video's container
    this.video.parentNode.appendChild(this.controls);
    this.controls.className = "vjs-controls";

    // Store the current video player's number
    // For referencing in event listeners
    this.controls.setAttribute("data-video-js", this.num);

    // Build the play control
    this.playControl = document.createElement("li");
    this.controls.appendChild(this.playControl);
    this.playControl.className = "vjs-play-control vjs-play";
    this.playControl.innerHTML = "<span></span>";

    // Build the progress control
    this.progressControl = document.createElement("li");
    this.controls.appendChild(this.progressControl);
    this.progressControl.className = "vjs-progress-control";

    // Create a list for the different progress elements
    this.progressList = document.createElement("ul");
    this.progressControl.appendChild(this.progressList);

    // Create a holder for the progress bars
    this.progressHolder = document.createElement("li");
    this.progressList.appendChild(this.progressHolder);
    this.progressHolder.className = "vjs-progress-holder";

    // Create the loading progress display
    this.loadProgress = document.createElement("span");
    this.progressHolder.appendChild(this.loadProgress)
    this.loadProgress.className = "vjs-load-progress";

    // Create the playing progress display
    this.playProgress = document.createElement("span");
    this.progressHolder.appendChild(this.playProgress);
    this.playProgress.className = "vjs-play-progress";

    // Create the progress time display (00:00 / 00:00)
    this.progressTime = document.createElement("li");
    this.progressList.appendChild(this.progressTime);
    this.progressTime.className = "vjs-progress-time";

    // Create the current play time display
    this.currentTimeDisplay = document.createElement("span");
    this.progressTime.appendChild(this.currentTimeDisplay);
    this.currentTimeDisplay.className = "vjs-current-time-display";
    this.currentTimeDisplay.innerHTML = '00:00';

    // Add time separator
    this.timeSeparator = document.createElement("span");
    this.timeSeparator.innerHTML = " / ";
    this.progressTime.appendChild(this.timeSeparator);

    // Create the total duration display
    this.durationDisplay = document.createElement("span");
    this.progressTime.appendChild(this.durationDisplay);
    this.durationDisplay.className = "vjs-duration-display";
    this.durationDisplay.innerHTML = '00:00';

    // Create the volumne control
    this.volumeControl = document.createElement("li");
    this.controls.appendChild(this.volumeControl);
    this.volumeControl.className = "vjs-volume-control";
    this.volumeControl.innerHTML = "<ul><li></li><li></li><li></li><li></li><li></li><li></li></ul>";
    this.volumeDisplay = this.volumeControl.children[0]

    // Crete the fullscreen control
    this.fullscreenControl = document.createElement("li");
    this.controls.appendChild(this.fullscreenControl);
    this.fullscreenControl.className = "vjs-fullscreen-control";
    this.fullscreenControl.innerHTML = "<ul><li></li><li></li><li></li><li></li></ul>";
  },

  // Show the controller
  showController: function(){
    this.controls.style.display = "block";
    this.positionController();
  },

  // Place controller relative to the video's position
  positionController: function(){
    // Make sure the controls are visible
    if (this.controls.style.display == 'none') return;

    this.controls.style.top = (this.video.offsetHeight - this.controls.offsetHeight) + "px";
    this.controls.style.left = "0px";
    this.controls.style.width = this.video.offsetWidth + "px";
    this.sizeProgressBar();
  },

  // Hide the controller
  hideController: function(){
    this.controls.style.display = "none";
  },

  // When the video is played
  onPlay: function(event){
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
    this.video.pause();
    this.onPause();
  },

  onVolumeChange: function(event){
    this.updateVolumeDisplay();
  },

  onError: function(event){
    console.log(event);
    console.log(this.video.error);
  },

  // React to clicks on the play/pause button
  onPlayControlClick: function(event){
    if (this.video.paused) {
      this.video.play();
    } else {
      this.video.pause();
    }
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

    this.blockTextSelection();
    document.onmousemove = function(event) {
      this.setPlayProgress(event.pageX);
    }.context(this);

    document.onmouseup = function(event) {
      this.unblockTextSelection();
      document.onmousemove = null;
      document.onmouseup = null;
      if (this.videoWasPlaying) {
        this.video.play();
        this.trackPlayProgress();
      }
    }.context(this);
  },

  // When the user stops dragging on the progress bar, update play position
  // Backup for when the user only clicks and doesn't drag
  onProgressHolderMouseUp: function(event){
    this.setPlayProgress(event.pageX);
  },

  // Adjust the volume when the user drags on the volume control
  onVolumeControlMouseDown: function(event){
    this.blockTextSelection();
    document.onmousemove = function(event) {
      this.setVolume(event.pageX);
    }.context(this);
    document.onmouseup = function() {
      this.unblockTextSelection();
      document.onmousemove = null;
      document.onmouseup = null;
    }.context(this);
  },

  // When the user stops dragging, set a new volume
  // Backup for when the user only clicks and doesn't drag
  onVolumeControlMouseUp: function(event){
    this.setVolume(event.pageX);
  },

  // When the user clicks on the fullscreen button, update fullscreen setting
  onFullscreenControlClick: function(event){
    if (!this.videoIsFullScreen) {
      this.fullscreenOn();
    } else {
      this.fullscreenOff();
    }
  },

  onVideoMouseOver: function(event){
    this.showController();
  },

  onVideoMouseOut: function(event){
    // Prevent flicker by making sure mouse hasn't left the video
    var parent = event.relatedTarget;
    while (parent && parent !== this.video && parent !== this.controls) {
      parent = parent.parentNode;
    }
    if (parent !== this.video && parent !== this.controls) {
      this.hideController();
    }
  },

  // Adjust the width of the progress bar to fill the controls width
  sizeProgressBar: function(){
    this.progressControl.style.width = (this.controls.offsetWidth - 125) + "px";
    this.progressHolder.style.width = (this.progressControl.offsetWidth - 80) + "px";
    this.updatePlayProgress();
  },

  // Track & display the current play progress
  trackPlayProgress: function(){
    this.playProgressInterval = setInterval(function(){ this.updatePlayProgress(); }.context(this), 33);
  },

  // Turn off play progress tracking (when paused)
  stopTrackingPlayProgress: function(){
    clearInterval(this.playProgressInterval);
  },

  // Ajust the play progress bar's width based on the current play time
  updatePlayProgress: function(){
    if (this.controls.style.display == 'none') return;
    this.playProgress.style.width = ((this.video.currentTime / this.video.duration) * (this.progressHolder.offsetWidth - 2)) + "px";
    this.updateTimeDisplay();
  },

  // Update the play position based on where the user clicked on the progresss bar
  setPlayProgress: function(clickX) {
    var newPercent = Math.max(0, Math.min(1, (clickX - this.findPosX(this.progressHolder)) / this.progressHolder.offsetWidth));
    this.video.currentTime = newPercent * this.video.duration
    this.playProgress.style.width = newPercent * (this.progressHolder.offsetWidth - 2)  + "px";
    this.updateTimeDisplay();
  },

  // Update the displayed time (00:00)
  updateTimeDisplay: function(){
    this.currentTimeDisplay.innerHTML = this.formatTime(this.video.currentTime);
    if (this.video.duration) this.durationDisplay.innerHTML = this.formatTime(this.video.duration);
  },

  // Set a new volume based on where the user clicked on the volume control
  setVolume: function(clickX) {
    var newVol = (clickX - this.findPosX(this.volumeControl)) / this.volumeControl.offsetWidth;
    if (newVol > 1) {
      newVol = 1;
    } else if (newVol < 0) {
      newVol = 0;
    }
    this.video.volume = newVol;
  },

  // Update the volume control display
  // Unique to these default controls. Uses borders to create the look of bars.
  updateVolumeDisplay: function(){
    var volNum = Math.floor(this.video.volume * 6);
    for(var i=0; i<6; i++) {
      if (i < volNum) {
        this.volumeDisplay.children[i].style.borderColor = "#fff";
      } else {
        this.volumeDisplay.children[i].style.borderColor = "#555";
      }
    }
  },

  // Turn on fullscreen (window) mode
  // Real fullscreen isn't available in browsers quite yet.
  fullscreenOn: function(){
    this.videoIsFullScreen = true;
    this.docOrigOverflow = document.documentElement.style.overflow;

    // Hide any scroll bars
    document.documentElement.style.overflow = 'hidden';
    this.fullscreenControl.className = "vjs-fullscreen-control vjs-fs-active";
    this.box.className = "video-js-box vjs-fullscreen";
    
    // Resize the video to the window
    this.positionController();
  },

  // Turn off fullscreen (window) mode
  fullscreenOff: function(){
    this.videoIsFullScreen = false;

    // Unhide scroll bars.
    document.documentElement.style.overflow = this.docOrigOverflow;

    // Remove window resizing event listener
    window.removeEventListener('resize', this.fullWindowResize, false);

    // Resize to original settings
    this.video.style.position = "static";
    this.controls.style.position = "absolute";
    this.positionController();
    this.fullscreenControl.className = "vjs-fullscreen-control";
    this.box.className = "video-js-box";
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
  formatTime: function(seconds) {
    seconds = Math.round(seconds);
    minutes = Math.floor(seconds / 60);
    minutes = (minutes >= 10) ? minutes : "0" + minutes;
    seconds = Math.floor(seconds % 60);
    seconds = (seconds >= 10) ? seconds : "0" + seconds;
    return minutes + ":" + seconds;
  },

  // Get an objects position on the page
  findPosX: function(obj) {
    var curleft = obj.offsetLeft;
    while(obj = obj.offsetParent) {
      curleft += obj.offsetLeft;
    }
    return curleft;
  }

})

// Class Methods

// Add video-js to any video tag with the class
VideoJS.setup = function(){
  if (VideoJS.supportsVideo()) {
    var videoTags = document.getElementsByTagName("video");
    for (var i=0;i<videoTags.length;i++) {
      if (videoTags[i].className.indexOf("video-js") != -1) {
        videoJSPlayers[i] = new VideoJS(videoTags[i], i);
      }
    }
  }
}

// Check if the browser supports video.
VideoJS.supportsVideo = function() {
  return !!document.createElement('video').canPlayType;
}


// Allows for binding context to functions
// when using in event listeners and timeouts
Function.prototype.context = function(obj) {
  var method = this
  temp = function() {
    return method.apply(obj, arguments)
  }
 return temp
}

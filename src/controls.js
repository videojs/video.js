goog.provide('_V_.Control');
goog.provide('_V_.ControlBar');
goog.provide('_V_.Button');
goog.provide('_V_.PlayButton');
goog.provide('_V_.PauseButton');
goog.provide('_V_.PlayToggle');
goog.provide('_V_.FullscreenToggle');
goog.provide('_V_.BigPlayButton');
goog.provide('_V_.LoadingSpinner');
goog.provide('_V_.CurrentTimeDisplay');
goog.provide('_V_.DurationDisplay');
goog.provide('_V_.TimeDivider');
goog.provide('_V_.RemainingTimeDisplay');
goog.provide('_V_.Slider');
goog.provide('_V_.ProgressControl');
goog.provide('_V_.SeekBar');
goog.provide('_V_.LoadProgressBar');
goog.provide('_V_.PlayProgressBar');
goog.provide('_V_.SeekHandle');
goog.provide('_V_.VolumeControl');
goog.provide('_V_.VolumeBar');
goog.provide('_V_.VolumeLevel');
goog.provide('_V_.VolumeHandle');
goog.provide('_V_.MuteToggle');
goog.provide('_V_.PosterImage');
goog.provide('_V_.Menu');
goog.provide('_V_.MenuItem');

goog.require('_V_.Component');

/* Control - Base class for all control elements
================================================================================ */
/**
 * Base class for all control elements
 * @param {_V_.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
_V_.Control = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(_V_.Control, _V_.Component);

_V_.Control.prototype.buildCSSClass = function(){
  return "vjs-control " + goog.base(this, 'buildCSSClass');
};

/* Control Bar
================================================================================ */
/**
 * Container of main controls
 * @param {_V_.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
_V_.ControlBar = function(player, options){
  goog.base(this, player, options);

  player.one("play", _V_.bind(this, function(){
    this.fadeIn();
    this.player.on("mouseover", _V_.bind(this, this.fadeIn));
    this.player.on("mouseout", _V_.bind(this, this.fadeOut));
  }));
};
goog.inherits(_V_.ControlBar, _V_.Component);

_V_.ControlBar.prototype.options = {
  loadEvent: "play",
  children: {
    "playToggle": {},
    "fullscreenToggle": {},
    "currentTimeDisplay": {},
    "timeDivider": {},
    "durationDisplay": {},
    "remainingTimeDisplay": {},
    "progressControl": {},
    "volumeControl": {},
    "muteToggle": {}
  }
};

_V_.ControlBar.prototype.createEl = function(){
  return _V_.createEl("div", {
    className: "vjs-control-bar"
  });
};

_V_.ControlBar.prototype.fadeIn = function(){
  goog.base(this, 'fadeIn');
  this.player.trigger("controlsvisible");
};

_V_.ControlBar.prototype.fadeOut = function(){
  goog.base(this, 'fadeOut');
  this.player.trigger("controlshidden");
};

_V_.ControlBar.prototype.lockShowing = function(){
  this.el_.style.opacity = "1";
};

/* Button - Base class for all buttons
================================================================================ */
/**
 * Base class for all buttons
 * @param {_V_.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
_V_.Button = function(player, options){
  goog.base(this, player, options);

  this.on("click", this.onClick);
  this.on("focus", this.onFocus);
  this.on("blur", this.onBlur);
};
goog.inherits(_V_.Button, _V_.Control);

_V_.Button.prototype.createEl = function(type, attrs){
  // Add standard Aria and Tabindex info
  attrs = _V_.merge({
    className: this.buildCSSClass(),
    innerHTML: '<div><span class="vjs-control-text">' + (this.buttonText || "Need Text") + '</span></div>',
    role: "button",
    tabIndex: 0
  }, attrs);

  return goog.base(this, 'createEl', type, attrs);
};

  // Click - Override with specific functionality for button
_V_.Button.prototype.onClick = function(){};

  // Focus - Add keyboard functionality to element
_V_.Button.prototype.onFocus = function(){
  _V_.on(document, "keyup", _V_.bind(this, this.onKeyPress));
};

  // KeyPress (document level) - Trigger click when keys are pressed
_V_.Button.prototype.onKeyPress = function(event){
  // Check for space bar (32) or enter (13) keys
  if (event.which == 32 || event.which == 13) {
    event.preventDefault();
    this.onClick();
  }
};

  // Blur - Remove keyboard triggers
_V_.Button.prototype.onBlur = function(){
  _V_.off(document, "keyup", _V_.bind(this, this.onKeyPress));
}

/* Play Button
================================================================================ */
/**
 * Basic play button
 * @param {_V_.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
_V_.PlayButton = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(_V_.PlayButton, _V_.Button);

_V_.PlayButton.prototype.buttonText = "Play";

_V_.PlayButton.prototype.buildCSSClass = function(){
  return "vjs-play-button " + goog.base(this, 'buildCSSClass');
};

_V_.PlayButton.prototype.onClick = function(){
  this.player.play();
}

/* Pause Button
================================================================================ */
/**
 * Basic pause button
 * @param {_V_.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
_V_.PauseButton = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(_V_.PauseButton, _V_.Button);

_V_.PauseButton.prototype.buttonText = "Play";

_V_.PauseButton.prototype.buildCSSClass = function(){
  return "vjs-pause-button " + goog.base(this, 'buildCSSClass');
};

_V_.PauseButton.prototype.onClick = function(){
  this.player.pause();
};

/* Play Toggle - Play or Pause Media
================================================================================ */
/**
 * Button to toggle between play and pause
 * @param {_V_.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
_V_.PlayToggle = function(player, options){
  goog.base(this, player, options);

  player.on("play", _V_.bind(this, this.onPlay));
  player.on("pause", _V_.bind(this, this.onPause));
};
goog.inherits(_V_.PlayToggle, _V_.Button);

_V_.PlayToggle.prototype.buttonText = "Play";

_V_.PlayToggle.prototype.buildCSSClass = function(){
  return "vjs-play-control " + goog.base(this, 'buildCSSClass');
};

  // OnClick - Toggle between play and pause
_V_.PlayToggle.prototype.onClick = function(){
  if (this.player.paused()) {
    this.player.play();
  } else {
    this.player.pause();
  }
};

  // OnPlay - Add the vjs-playing class to the element so it can change appearance
_V_.PlayToggle.prototype.onPlay = function(){
  _V_.removeClass(this.el_, "vjs-paused");
  _V_.addClass(this.el_, "vjs-playing");
};

  // OnPause - Add the vjs-paused class to the element so it can change appearance
_V_.PlayToggle.prototype.onPause = function(){
  _V_.removeClass(this.el_, "vjs-playing");
  _V_.addClass(this.el_, "vjs-paused");
}


/* Fullscreen Toggle Behaviors
================================================================================ */
/**
 * Toggle fullscreen video
 * @param {_V_.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
_V_.FullscreenToggle = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(_V_.FullscreenToggle, _V_.Button);

_V_.FullscreenToggle.prototype.buttonText = "Fullscreen";

_V_.FullscreenToggle.prototype.buildCSSClass = function(){
  return "vjs-fullscreen-control " + goog.base(this, 'buildCSSClass');
};

_V_.FullscreenToggle.prototype.onClick = function(){
  if (!this.player.isFullScreen) {
    this.player.requestFullScreen();
  } else {
    this.player.cancelFullScreen();
  }
};


/* Big Play Button
================================================================================ */
/**
 * Initial play button. Shows before the video has played.
 * @param {_V_.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
_V_.BigPlayButton = function(player, options){
  goog.base(this, player, options);

  player.on("play", _V_.bind(this, this.hide));
  player.on("ended", _V_.bind(this, this.show));
};
goog.inherits(_V_.BigPlayButton, _V_.Button);

_V_.BigPlayButton.prototype.createEl = function(){
  return goog.base(this, 'createEl', "div", {
    className: "vjs-big-play-button",
    innerHTML: "<span></span>"
  });
};

_V_.BigPlayButton.prototype.onClick = function(){
  // Go back to the beginning if big play button is showing at the end.
  // Have to check for current time otherwise it might throw a 'not ready' error.
  if(this.player.currentTime()) {
    this.player.currentTime(0);
  }
  this.player.play();
};

/* Loading Spinner
================================================================================ */
/**
 * Loading spinner for waiting events
 * @param {_V_.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
_V_.LoadingSpinner = function(player, options){
  goog.base(this, player, options);

  player.on("canplay", _V_.bind(this, this.hide));
  player.on("canplaythrough", _V_.bind(this, this.hide));
  player.on("playing", _V_.bind(this, this.hide));
  player.on("seeked", _V_.bind(this, this.hide));

  player.on("seeking", _V_.bind(this, this.show));

  // in some browsers seeking does not trigger the 'playing' event,
  // so we also need to trap 'seeked' if we are going to set a
  // 'seeking' event
  player.on("seeked", _V_.bind(this, this.hide));

  player.on("error", _V_.bind(this, this.show));

  // Not showing spinner on stalled any more. Browsers may stall and then not trigger any events that would remove the spinner.
  // Checked in Chrome 16 and Safari 5.1.2. http://help.videojs.com/discussions/problems/883-why-is-the-download-progress-showing
  // player.on("stalled", _V_.bind(this, this.show));

  player.on("waiting", _V_.bind(this, this.show));
};
goog.inherits(_V_.LoadingSpinner, _V_.Component);

_V_.LoadingSpinner.prototype.createEl = function(){
  var classNameSpinner, innerHtmlSpinner;

  if ( typeof this.player.getEl().style.WebkitBorderRadius == "string"
       || typeof this.player.getEl().style.MozBorderRadius == "string"
       || typeof this.player.getEl().style.KhtmlBorderRadius == "string"
       || typeof this.player.getEl().style.borderRadius == "string")
    {
      classNameSpinner = "vjs-loading-spinner";
      innerHtmlSpinner = "<div class='ball1'></div><div class='ball2'></div><div class='ball3'></div><div class='ball4'></div><div class='ball5'></div><div class='ball6'></div><div class='ball7'></div><div class='ball8'></div>";
    } else {
      classNameSpinner = "vjs-loading-spinner-fallback";
      innerHtmlSpinner = "";
    }

  return goog.base(this, 'createEl', "div", {
    className: classNameSpinner,
    innerHTML: innerHtmlSpinner
  });
};

/* Time
================================================================================ */

/**
 * Displays the current time
 * @param {_V_.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
_V_.CurrentTimeDisplay = function(player, options){
  goog.base(this, player, options);

  player.on("timeupdate", _V_.bind(this, this.updateContent));
};
goog.inherits(_V_.CurrentTimeDisplay, _V_.Component);

_V_.CurrentTimeDisplay.prototype.createEl = function(){
  var el = goog.base(this, 'createEl', "div", {
    className: "vjs-current-time vjs-time-controls vjs-control"
  });

  this.content = _V_.createEl("div", {
    className: "vjs-current-time-display",
    innerHTML: '0:00'
  });

  el.appendChild(_V_.createEl("div").appendChild(this.content));
  return el;
};

_V_.CurrentTimeDisplay.prototype.updateContent = function(){
  // Allows for smooth scrubbing, when player can't keep up.
  var time = (this.player.scrubbing) ? this.player.getCache().currentTime : this.player.currentTime();
  this.content.innerHTML = _V_.formatTime(time, this.player.duration());
};

/**
 * Displays the duration
 * @param {_V_.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
_V_.DurationDisplay = function(player, options){
  goog.base(this, player, options);

  player.on("timeupdate", _V_.bind(this, this.updateContent));
};
goog.inherits(_V_.DurationDisplay, _V_.Component);

_V_.DurationDisplay.prototype.createEl = function(){
  var el = goog.base(this, 'createEl', "div", {
    className: "vjs-duration vjs-time-controls vjs-control"
  });

  this.content = _V_.createEl("div", {
    className: "vjs-duration-display",
    innerHTML: '0:00'
  });

  el.appendChild(_V_.createEl("div").appendChild(this.content));
  return el;
};

_V_.DurationDisplay.prototype.updateContent = function(){
  if (this.player.duration()) { this.content.innerHTML = _V_.formatTime(this.player.duration()); }
};

/**
 * Time Separator (Not used in main skin, but still available, and could be used as a 'spare element')
 * @param {_V_.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
_V_.TimeDivider = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(_V_.TimeDivider, _V_.Component);

_V_.TimeDivider.prototype.createEl = function(){
  return goog.base(this, 'createEl', "div", {
    className: "vjs-time-divider",
    innerHTML: '<div><span>/</span></div>'
  });
};

/**
 * Displays the time left in the video
 * @param {_V_.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
_V_.RemainingTimeDisplay = function(player, options){
  goog.base(this, player, options);

  player.on("timeupdate", _V_.bind(this, this.updateContent));
};
goog.inherits(_V_.RemainingTimeDisplay, _V_.Component);


_V_.RemainingTimeDisplay.prototype.createEl = function(){
  var el = goog.base(this, 'createEl', "div", {
    className: "vjs-remaining-time vjs-time-controls vjs-control"
  });

  this.content = _V_.createEl("div", {
    className: "vjs-remaining-time-display",
    innerHTML: '-0:00'
  });

  el.appendChild(_V_.createEl("div").appendChild(this.content));
  return el;
};

_V_.RemainingTimeDisplay.prototype.updateContent = function(){
  if (this.player.duration()) { this.content.innerHTML = "-"+_V_.formatTime(this.player.remainingTime()); }

  // Allows for smooth scrubbing, when player can't keep up.
  // var time = (this.player.scrubbing) ? this.player.getCache().currentTime : this.player.currentTime();
  // this.content.innerHTML = _V_.formatTime(time, this.player.duration());
};

/* Slider
================================================================================ */
/**
 * Parent for seek bar and volume slider
 * @param {_V_.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
_V_.Slider = function(player, options){
    goog.base(this, player, options);

    // Set property names to bar and handle to match with the child Slider class is looking for
    this.bar = this.getChild(this.options["barName"]);
    this.handle = this.getChild(this.options["handleName"]);

    // console.log('asdf', this.bar, this.childNameIndex_, this.options)

    player.on(this.playerEvent, _V_.bind(this, this.update));

    this.on("mousedown", this.onMouseDown);
    this.on("focus", this.onFocus);
    this.on("blur", this.onBlur);

    this.player.on("controlsvisible", _V_.bind(this, this.update));

    // This is actually to fix the volume handle position. http://twitter.com/#!/gerritvanaaken/status/159046254519787520
    // this.player.one("timeupdate", _V_.bind(this, this.update));

    player.ready(_V_.bind(this, this.update));
};
goog.inherits(_V_.Slider, _V_.Component);

_V_.Slider.prototype.createEl = function(type, attrs) {
  attrs = _V_.merge({
    role: "slider",
    "aria-valuenow": 0,
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    tabIndex: 0
  }, attrs);

  return goog.base(this, 'createEl', type, attrs);
};

_V_.Slider.prototype.onMouseDown = function(event){
  event.preventDefault();
  _V_.blockTextSelection();

  _V_.on(document, "mousemove", _V_.bind(this, this.onMouseMove));
  _V_.on(document, "mouseup", _V_.bind(this, this.onMouseUp));

  this.onMouseMove(event);
};

_V_.Slider.prototype.onMouseUp = function(event) {
  _V_.unblockTextSelection();
  _V_.off(document, "mousemove", this.onMouseMove, false);
  _V_.off(document, "mouseup", this.onMouseUp, false);

  this.update();
};

_V_.Slider.prototype.update = function(){
  // If scrubbing, we could use a cached value to make the handle keep up with the user's mouse.
  // On HTML5 browsers scrubbing is really smooth, but some flash players are slow, so we might want to utilize this later.
  // var progress =  (this.player.scrubbing) ? this.player.getCache().currentTime / this.player.duration() : this.player.currentTime() / this.player.duration();

  var barProgress,
      progress = this.getPercent();
      handle = this.handle,
      bar = this.bar;

  // Protect against no duration and other division issues
  if (isNaN(progress)) { progress = 0; }

  barProgress = progress;

  // If there is a handle, we need to account for the handle in our calculation for progress bar
  // so that it doesn't fall short of or extend past the handle.
  if (handle) {

    var box = this.el_,
        boxWidth = box.offsetWidth,

        handleWidth = handle.getEl().offsetWidth,

        // The width of the handle in percent of the containing box
        // In IE, widths may not be ready yet causing NaN
        handlePercent = (handleWidth) ? handleWidth / boxWidth : 0,

        // Get the adjusted size of the box, considering that the handle's center never touches the left or right side.
        // There is a margin of half the handle's width on both sides.
        boxAdjustedPercent = 1 - handlePercent;

        // Adjust the progress that we'll use to set widths to the new adjusted box width
        adjustedProgress = progress * boxAdjustedPercent,

        // The bar does reach the left side, so we need to account for this in the bar's width
        barProgress = adjustedProgress + (handlePercent / 2);

    // Move the handle from the left based on the adjected progress
    handle.getEl().style.left = _V_.round(adjustedProgress * 100, 2) + "%";
  }

  // Set the new bar width
  bar.getEl().style.width = _V_.round(barProgress * 100, 2) + "%";
};

_V_.Slider.prototype.calculateDistance = function(event){
  var box = this.el_,
      boxX = _V_.findPosX(box),
      boxW = box.offsetWidth,
      handle = this.handle;

  if (handle) {
    var handleW = handle.getEl().offsetWidth;

    // Adjusted X and Width, so handle doesn't go outside the bar
    boxX = boxX + (handleW / 2);
    boxW = boxW - handleW;
  }

  // Percent that the click is through the adjusted area
  return Math.max(0, Math.min(1, (event.pageX - boxX) / boxW));
};

_V_.Slider.prototype.onFocus = function(event){
  _V_.on(document, "keyup", _V_.bind(this, this.onKeyPress));
};

_V_.Slider.prototype.onKeyPress = function(event){
  if (event.which == 37) { // Left Arrow
    event.preventDefault();
    this.stepBack();
  } else if (event.which == 39) { // Right Arrow
    event.preventDefault();
    this.stepForward();
  }
};

_V_.Slider.prototype.onBlur = function(event){
  _V_.off(document, "keyup", _V_.bind(this, this.onKeyPress));
};


/* Progress
================================================================================ */

/**
 * Seek, Load Progress, and Play Progress
 * @param {_V_.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
_V_.ProgressControl = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(_V_.ProgressControl, _V_.Component);

_V_.ProgressControl.prototype.options = {
  children: {
    "seekBar": {}
  }
};

_V_.ProgressControl.prototype.createEl = function(){
  return goog.base(this, 'createEl', "div", {
    className: "vjs-progress-control vjs-control"
  });
};

/**
 * Seek Bar and holder for the progress bars
 * @param {_V_.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
_V_.SeekBar = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(_V_.SeekBar, _V_.Slider);

_V_.SeekBar.prototype.options = {
  children: {
    "loadProgressBar": {},
    "playProgressBar": {},
    "seekHandle": {}
  },
  "barName": "playProgressBar",
  "handleName": "seekHandle"
};

_V_.SeekBar.prototype.playerEvent = "timeupdate";

_V_.SeekBar.prototype.createEl = function(){
  return goog.base(this, 'createEl', "div", {
    className: "vjs-progress-holder"
  });
};

_V_.SeekBar.prototype.getPercent = function(){
  return this.player.currentTime() / this.player.duration();
};

_V_.SeekBar.prototype.onMouseDown = function(event){
  goog.base(this, 'onMouseDown', event);

  this.player.scrubbing = true;

  this.videoWasPlaying = !this.player.paused();
  this.player.pause();
};

_V_.SeekBar.prototype.onMouseMove = function(event){
  var newTime = this.calculateDistance(event) * this.player.duration();

  // Don't let video end while scrubbing.
  if (newTime == this.player.duration()) { newTime = newTime - 0.1; }

  // Set new time (tell player to seek to new time)
  this.player.currentTime(newTime);
};

_V_.SeekBar.prototype.onMouseUp = function(event){
  goog.base(this, 'onMouseUp', event);

  this.player.scrubbing = false;
  if (this.videoWasPlaying) {
    this.player.play();
  }
};

_V_.SeekBar.prototype.stepForward = function(){
  this.player.currentTime(this.player.currentTime() + 1);
};

_V_.SeekBar.prototype.stepBack = function(){
  this.player.currentTime(this.player.currentTime() - 1);
};


/**
 * Shows load progres
 * @param {_V_.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
_V_.LoadProgressBar = function(player, options){
  goog.base(this, player, options);
  player.on("progress", _V_.bind(this, this.update));
};
goog.inherits(_V_.LoadProgressBar, _V_.Component);

_V_.LoadProgressBar.prototype.createEl = function(){
  return goog.base(this, 'createEl', "div", {
    className: "vjs-load-progress",
    innerHTML: '<span class="vjs-control-text">Loaded: 0%</span>'
  });
};

_V_.LoadProgressBar.prototype.update = function(){
  if (this.el_.style) { this.el_.style.width = _V_.round(this.player.bufferedPercent() * 100, 2) + "%"; }
};


/**
 * Shows play progress
 * @param {_V_.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
_V_.PlayProgressBar = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(_V_.PlayProgressBar, _V_.Component);

_V_.PlayProgressBar.prototype.createEl = function(){
  return goog.base(this, 'createEl', "div", {
    className: "vjs-play-progress",
    innerHTML: '<span class="vjs-control-text">Progress: 0%</span>'
  });
};

/**
 * SeekBar Behavior includes play progress bar, and seek handle
 * Needed so it can determine seek position based on handle position/size
 * @param {_V_.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
_V_.SeekHandle = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(_V_.SeekHandle, _V_.Component);

_V_.SeekHandle.prototype.createEl = function(){
  return goog.base(this, 'createEl', "div", {
    className: "vjs-seek-handle",
    innerHTML: '<span class="vjs-control-text">00:00</span>'
  });
};

/**
 * Control the volume
 * @param {_V_.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
_V_.VolumeControl = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(_V_.VolumeControl, _V_.Component);

_V_.VolumeControl.prototype.options = {
  children: {
    "volumeBar": {}
  }
};

_V_.VolumeControl.prototype.createEl = function(){
  return goog.base(this, 'createEl', "div", {
    className: "vjs-volume-control vjs-control"
  });
};

/**
 * Contains volume level
 * @param {_V_.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
_V_.VolumeBar = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(_V_.VolumeBar, _V_.Slider);

_V_.VolumeBar.prototype.options = {
  children: {
    "volumeLevel": {},
    "volumeHandle": {}
  },
  "barName": "volumeLevel",
  "handleName": "volumeHandle"
};

_V_.VolumeBar.prototype.playerEvent = "volumechange";

_V_.VolumeBar.prototype.createEl = function(){
  return goog.base(this, 'createEl', "div", {
    className: "vjs-volume-bar"
  });
};

_V_.VolumeBar.prototype.onMouseMove = function(event) {
  this.player.volume(this.calculateDistance(event));
};

_V_.VolumeBar.prototype.getPercent = function(){
   return this.player.volume();
};

_V_.VolumeBar.prototype.stepForward = function(){
  this.player.volume(this.player.volume() + 0.1);
};

_V_.VolumeBar.prototype.stepBack = function(){
  this.player.volume(this.player.volume() - 0.1);
};

/**
 * Shows volume level
 * @param {_V_.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
_V_.VolumeLevel = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(_V_.VolumeLevel, _V_.Component);

_V_.VolumeLevel.prototype.createEl = function(){
  return goog.base(this, 'createEl', "div", {
    className: "vjs-volume-level",
    innerHTML: '<span class="vjs-control-text"></span>'
  });
};

/**
 * Change volume level
 * @param {_V_.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
_V_.VolumeHandle = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(_V_.VolumeHandle, _V_.Component);

_V_.VolumeHandle.prototype.createEl = function(){
  return goog.base(this, 'createEl', "div", {
    className: "vjs-volume-handle",
    innerHTML: '<span class="vjs-control-text"></span>'
    // tabindex: 0,
    // role: "slider", "aria-valuenow": 0, "aria-valuemin": 0, "aria-valuemax": 100
  });
};

/**
 * Mute the audio
 * @param {_V_.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
_V_.MuteToggle = function(player, options){
  goog.base(this, player, options);

  player.on("volumechange", _V_.bind(this, this.update));
};
goog.inherits(_V_.MuteToggle, _V_.Button);

_V_.MuteToggle.prototype.createEl = function(){
  return goog.base(this, 'createEl', "div", {
    className: "vjs-mute-control vjs-control",
    innerHTML: '<div><span class="vjs-control-text">Mute</span></div>'
  });
};

_V_.MuteToggle.prototype.onClick = function(event){
  this.player.muted( this.player.muted() ? false : true );
};

_V_.MuteToggle.prototype.update = function(event){
  var vol = this.player.volume(),
      level = 3;

  if (vol == 0 || this.player.muted()) {
    level = 0;
  } else if (vol < 0.33) {
    level = 1;
  } else if (vol < 0.67) {
    level = 2;
  }

  /* TODO improve muted icon classes */
  for (var i = 0; i < 4; i++) {
    _V_.removeClass(this.el_, "vjs-vol-"+i);
  };
  _V_.addClass(this.el_, "vjs-vol-"+level);
}

/* Poster Image
================================================================================ */
/**
 * Poster image. Shows before the video plays.
 * @param {_V_.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
_V_.PosterImage = function(player, options){
  goog.base(this, player, options);

  if (!this.player.options.poster) {
    this.hide();
  }

  player.on("play", _V_.bind(this, this.hide));
};
goog.inherits(_V_.PosterImage, _V_.Button);

_V_.PosterImage.prototype.createEl = function(){
  var el = _V_.createEl("img", {
    className: "vjs-poster",

    // Don't want poster to be tabbable.
    tabIndex: -1
  });

  // src throws errors if no poster was defined.
  if (this.player.options.poster) {
    el.src = this.player.options.poster;
  }
  return el;
};

_V_.PosterImage.prototype.onClick = function(){
  this.player.play();
}

/* Menu
================================================================================ */
/**
 * The base for text track and settings menu buttons.
 * @param {_V_.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
_V_.Menu = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(_V_.Menu, _V_.Component);

_V_.Menu.prototype.addItem = function(component){
  this.addComponent(component);
  component.on("click", _V_.bind(this, function(){
    this.unlockShowing();
  }));
};

_V_.Menu.prototype.createEl = function(){
  return goog.base(this, 'createEl', "ul", {
    className: "vjs-menu"
  });
};

/**
 * Menu item
 * @param {_V_.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
_V_.MenuItem = function(player, options){
  goog.base(this, player, options);

  if (options.selected) {
    this.addClass("vjs-selected");
  }
};
goog.inherits(_V_.MenuItem, _V_.Button);

_V_.MenuItem.prototype.createEl = function(type, attrs){
  return goog.base(this, 'createEl', "li", _V_.merge({
    className: "vjs-menu-item",
    innerHTML: this.options.label
  }, attrs));
};

_V_.MenuItem.prototype.onClick = function(){
  this.selected(true);
};

_V_.MenuItem.prototype.selected = function(selected){
  if (selected) {
    this.addClass("vjs-selected");
  } else {
    this.removeClass("vjs-selected")
  }
};


// /* Control - Base class for all control elements
// ================================================================================ */
// _V_.Control = _V_.Component.extend({

//   buildCSSClass: function(){
//     return "vjs-control " + this._super();
//   }

// });

// /* Control Bar
// ================================================================================ */
// _V_.ControlBar = _V_.Component.extend({

//   options: {
//     loadEvent: "play",
//     children: {
//       "playToggle": {},
//       "fullscreenToggle": {},
//       "currentTimeDisplay": {},
//       "timeDivider": {},
//       "durationDisplay": {},
//       "remainingTimeDisplay": {},
//       "progressControl": {},
//       "volumeControl": {},
//       "muteToggle": {}
//     }
//   },

//   init: function(player, options){
//     this._super(player, options);

//     player.one("play", _V_.bind(this, function(){
//       this.fadeIn();
//       this.player.on("mouseover", _V_.bind(this, this.fadeIn));
//       this.player.on("mouseout", _V_.bind(this, this.fadeOut));
//     }));

//   },

//   createEl: function(){
//     return _V_.createEl("div", {
//       className: "vjs-controls"
//     });
//   },

//   fadeIn: function(){
//     this._super();
//     this.player.trigger("controlsvisible");
//   },

//   fadeOut: function(){
//     this._super();
//     this.player.trigger("controlshidden");
//   },

//   lockShowing: function(){
//     this.el_.style.opacity = "1";
//   }

// });

// /* Button - Base class for all buttons
// ================================================================================ */
// _V_.Button = _V_.Control.extend({

//   init: function(player, options){
//     this._super(player, options);

//     this.on("click", this.onClick);
//     this.on("focus", this.onFocus);
//     this.on("blur", this.onBlur);
//   },

//   createEl: function(type, attrs){
//     // Add standard Aria and Tabindex info
//     attrs = _V_.merge({
//       className: this.buildCSSClass(),
//       innerHTML: '<div><span class="vjs-control-text">' + (this.buttonText || "Need Text") + '</span></div>',
//       role: "button",
//       tabIndex: 0
//     }, attrs);

//     return this._super(type, attrs);
//   },

//   // Click - Override with specific functionality for button
//   onClick: function(){},

//   // Focus - Add keyboard functionality to element
//   onFocus: function(){
//     _V_.on(document, "keyup", _V_.bind(this, this.onKeyPress));
//   },

//   // KeyPress (document level) - Trigger click when keys are pressed
//   onKeyPress: function(event){
//     // Check for space bar (32) or enter (13) keys
//     if (event.which == 32 || event.which == 13) {
//       event.preventDefault();
//       this.onClick();
//     }
//   },

//   // Blur - Remove keyboard triggers
//   onBlur: function(){
//     _V_.off(document, "keyup", _V_.bind(this, this.onKeyPress));
//   }

// });

// /* Play Button
// ================================================================================ */
// _V_.PlayButton = _V_.Button.extend({

//   buttonText: "Play",

//   buildCSSClass: function(){
//     return "vjs-play-button " + this._super();
//   },

//   onClick: function(){
//     this.player.play();
//   }

// });

// /* Pause Button
// ================================================================================ */
// _V_.PauseButton = _V_.Button.extend({

//   buttonText: "Pause",

//   buildCSSClass: function(){
//     return "vjs-pause-button " + this._super();
//   },

//   onClick: function(){
//     this.player.pause();
//   }

// });

// /* Play Toggle - Play or Pause Media
// ================================================================================ */
// _V_.PlayToggle = _V_.Button.extend({

//   buttonText: "Play",

//   init: function(player, options){
//     this._super(player, options);

//     player.on("play", _V_.bind(this, this.onPlay));
//     player.on("pause", _V_.bind(this, this.onPause));
//   },

//   buildCSSClass: function(){
//     return "vjs-play-control " + this._super();
//   },

//   // OnClick - Toggle between play and pause
//   onClick: function(){
//     if (this.player.paused()) {
//       this.player.play();
//     } else {
//       this.player.pause();
//     }
//   },

//   // OnPlay - Add the vjs-playing class to the element so it can change appearance
//   onPlay: function(){
//     _V_.removeClass(this.el_, "vjs-paused");
//     _V_.addClass(this.el_, "vjs-playing");
//   },

//   // OnPause - Add the vjs-paused class to the element so it can change appearance
//   onPause: function(){
//     _V_.removeClass(this.el_, "vjs-playing");
//     _V_.addClass(this.el_, "vjs-paused");
//   }

// });


// /* Fullscreen Toggle Behaviors
// ================================================================================ */
// _V_.FullscreenToggle = _V_.Button.extend({

//   buttonText: "Fullscreen",

//   buildCSSClass: function(){
//     return "vjs-fullscreen-control " + this._super();
//   },

//   onClick: function(){
//     if (!this.player.isFullScreen) {
//       this.player.requestFullScreen();
//     } else {
//       this.player.cancelFullScreen();
//     }
//   }

// });

// /* Big Play Button
// ================================================================================ */
// _V_.BigPlayButton = _V_.Button.extend({
//   init: function(player, options){
//     this._super(player, options);

//     player.on("play", _V_.bind(this, this.hide));
//     player.on("ended", _V_.bind(this, this.show));
//   },

//   createEl: function(){
//     return this._super("div", {
//       className: "vjs-big-play-button",
//       innerHTML: "<span></span>"
//     });
//   },

//   onClick: function(){
//     // Go back to the beginning if big play button is showing at the end.
//     // Have to check for current time otherwise it might throw a 'not ready' error.
//     if(this.player.currentTime()) {
//       this.player.currentTime(0);
//     }
//     this.player.play();
//   }
// });

// /* Loading Spinner
// ================================================================================ */
// _V_.LoadingSpinner = _V_.Component.extend({
//   init: function(player, options){
//     this._super(player, options);

//     player.on("canplay", _V_.bind(this, this.hide));
//     player.on("canplaythrough", _V_.bind(this, this.hide));
//     player.on("playing", _V_.bind(this, this.hide));
//     player.on("seeked", _V_.bind(this, this.hide));

//     player.on("seeking", _V_.bind(this, this.show));

//     // in some browsers seeking does not trigger the 'playing' event,
//     // so we also need to trap 'seeked' if we are going to set a
//     // 'seeking' event
//     player.on("seeked", _V_.bind(this, this.hide));

//     player.on("error", _V_.bind(this, this.show));

//     // Not showing spinner on stalled any more. Browsers may stall and then not trigger any events that would remove the spinner.
//     // Checked in Chrome 16 and Safari 5.1.2. http://help.videojs.com/discussions/problems/883-why-is-the-download-progress-showing
//     // player.on("stalled", _V_.bind(this, this.show));

//     player.on("waiting", _V_.bind(this, this.show));
//   },

//   createEl: function(){

//     var classNameSpinner, innerHtmlSpinner;

//     if ( typeof this.player.getEl().style.WebkitBorderRadius == "string"
//          || typeof this.player.getEl().style.MozBorderRadius == "string"
//          || typeof this.player.getEl().style.KhtmlBorderRadius == "string"
//          || typeof this.player.getEl().style.borderRadius == "string")
//       {
//         classNameSpinner = "vjs-loading-spinner";
//         innerHtmlSpinner = "<div class='ball1'></div><div class='ball2'></div><div class='ball3'></div><div class='ball4'></div><div class='ball5'></div><div class='ball6'></div><div class='ball7'></div><div class='ball8'></div>";
//       } else {
//         classNameSpinner = "vjs-loading-spinner-fallback";
//         innerHtmlSpinner = "";
//       }

//     return this._super("div", {
//       className: classNameSpinner,
//       innerHTML: innerHtmlSpinner
//     });
//   }
// });

// /* Time
// ================================================================================ */
// _V_.CurrentTimeDisplay = _V_.Component.extend({

//   init: function(player, options){
//     this._super(player, options);

//     player.on("timeupdate", _V_.bind(this, this.updateContent));
//   },

//   createEl: function(){
//     var el = this._super("div", {
//       className: "vjs-current-time vjs-time-controls vjs-control"
//     });

//     this.content = _V_.createEl("div", {
//       className: "vjs-current-time-display",
//       innerHTML: '0:00'
//     });

//     el.appendChild(_V_.createEl("div").appendChild(this.content));
//     return el;
//   },

//   updateContent: function(){
//     // Allows for smooth scrubbing, when player can't keep up.
//     var time = (this.player.scrubbing) ? this.player.getCache().currentTime : this.player.currentTime();
//     this.content.innerHTML = _V_.formatTime(time, this.player.duration());
//   }

// });

// _V_.DurationDisplay = _V_.Component.extend({

//   init: function(player, options){
//     this._super(player, options);

//     player.on("timeupdate", _V_.bind(this, this.updateContent));
//   },

//   createEl: function(){
//     var el = this._super("div", {
//       className: "vjs-duration vjs-time-controls vjs-control"
//     });

//     this.content = _V_.createEl("div", {
//       className: "vjs-duration-display",
//       innerHTML: '0:00'
//     });

//     el.appendChild(_V_.createEl("div").appendChild(this.content));
//     return el;
//   },

//   updateContent: function(){
//     if (this.player.duration()) { this.content.innerHTML = _V_.formatTime(this.player.duration()); }
//   }

// });

// // Time Separator (Not used in main skin, but still available, and could be used as a 'spare element')
// _V_.TimeDivider = _V_.Component.extend({

//   createEl: function(){
//     return this._super("div", {
//       className: "vjs-time-divider",
//       innerHTML: '<div><span>/</span></div>'
//     });
//   }

// });

// _V_.RemainingTimeDisplay = _V_.Component.extend({

//   init: function(player, options){
//     this._super(player, options);

//     player.on("timeupdate", _V_.bind(this, this.updateContent));
//   },

//   createEl: function(){
//     var el = this._super("div", {
//       className: "vjs-remaining-time vjs-time-controls vjs-control"
//     });

//     this.content = _V_.createEl("div", {
//       className: "vjs-remaining-time-display",
//       innerHTML: '-0:00'
//     });

//     el.appendChild(_V_.createEl("div").appendChild(this.content));
//     return el;
//   },

//   updateContent: function(){
//     if (this.player.duration()) { this.content.innerHTML = "-"+_V_.formatTime(this.player.remainingTime()); }

//     // Allows for smooth scrubbing, when player can't keep up.
//     // var time = (this.player.scrubbing) ? this.player.getCache().currentTime : this.player.currentTime();
//     // this.content.innerHTML = _V_.formatTime(time, this.player.duration());
//   }

// });

// /* Slider - Parent for seek bar and volume slider
// ================================================================================ */
// _V_.Slider = _V_.Component.extend({

//   init: function(player, options){
//     this._super(player, options);

//     player.on(this.playerEvent, _V_.bind(this, this.update));

//     this.on("mousedown", this.onMouseDown);
//     this.on("focus", this.onFocus);
//     this.on("blur", this.onBlur);

//     this.player.on("controlsvisible", _V_.bind(this, this.update));

//     // This is actually to fix the volume handle position. http://twitter.com/#!/gerritvanaaken/status/159046254519787520
//     // this.player.one("timeupdate", _V_.bind(this, this.update));

//     this.update();
//   },

//   createEl: function(type, attrs) {
//     attrs = _V_.merge({
//       role: "slider",
//       "aria-valuenow": 0,
//       "aria-valuemin": 0,
//       "aria-valuemax": 100,
//       tabIndex: 0
//     }, attrs);

//     return this._super(type, attrs);
//   },

//   onMouseDown: function(event){
//     event.preventDefault();
//     _V_.blockTextSelection();

//     _V_.on(document, "mousemove", _V_.bind(this, this.onMouseMove));
//     _V_.on(document, "mouseup", _V_.bind(this, this.onMouseUp));

//     this.onMouseMove(event);
//   },

//   onMouseUp: function(event) {
//     _V_.unblockTextSelection();
//     _V_.off(document, "mousemove", this.onMouseMove, false);
//     _V_.off(document, "mouseup", this.onMouseUp, false);

//     this.update();
//   },

//   update: function(){
//     // If scrubbing, we could use a cached value to make the handle keep up with the user's mouse.
//     // On HTML5 browsers scrubbing is really smooth, but some flash players are slow, so we might want to utilize this later.
//     // var progress =  (this.player.scrubbing) ? this.player.getCache().currentTime / this.player.duration() : this.player.currentTime() / this.player.duration();

//     var barProgress,
//         progress = this.getPercent();
//         handle = this.handle,
//         bar = this.bar;

//     // Protect against no duration and other division issues
//     if (isNaN(progress)) { progress = 0; }

//     barProgress = progress;

//     // If there is a handle, we need to account for the handle in our calculation for progress bar
//     // so that it doesn't fall short of or extend past the handle.
//     if (handle) {

//       var box = this.el_,
//           boxWidth = box.offsetWidth,

//           handleWidth = handle.el.offsetWidth,

//           // The width of the handle in percent of the containing box
//           // In IE, widths may not be ready yet causing NaN
//           handlePercent = (handleWidth) ? handleWidth / boxWidth : 0,

//           // Get the adjusted size of the box, considering that the handle's center never touches the left or right side.
//           // There is a margin of half the handle's width on both sides.
//           boxAdjustedPercent = 1 - handlePercent;

//           // Adjust the progress that we'll use to set widths to the new adjusted box width
//           adjustedProgress = progress * boxAdjustedPercent,

//           // The bar does reach the left side, so we need to account for this in the bar's width
//           barProgress = adjustedProgress + (handlePercent / 2);

//       // Move the handle from the left based on the adjected progress
//       handle.el.style.left = _V_.round(adjustedProgress * 100, 2) + "%";
//     }

//     // Set the new bar width
//     bar.el.style.width = _V_.round(barProgress * 100, 2) + "%";
//   },

//   calculateDistance: function(event){
//     var box = this.el_,
//         boxX = _V_.findPosX(box),
//         boxW = box.offsetWidth,
//         handle = this.handle;

//     if (handle) {
//       var handleW = handle.el.offsetWidth;

//       // Adjusted X and Width, so handle doesn't go outside the bar
//       boxX = boxX + (handleW / 2);
//       boxW = boxW - handleW;
//     }

//     // Percent that the click is through the adjusted area
//     return Math.max(0, Math.min(1, (event.pageX - boxX) / boxW));
//   },

//   onFocus: function(event){
//     _V_.on(document, "keyup", _V_.bind(this, this.onKeyPress));
//   },

//   onKeyPress: function(event){
//     if (event.which == 37) { // Left Arrow
//       event.preventDefault();
//       this.stepBack();
//     } else if (event.which == 39) { // Right Arrow
//       event.preventDefault();
//       this.stepForward();
//     }
//   },

//   onBlur: function(event){
//     _V_.off(document, "keyup", _V_.bind(this, this.onKeyPress));
//   }
// });


// /* Progress
// ================================================================================ */

// // Progress Control: Seek, Load Progress, and Play Progress
// _V_.ProgressControl = _V_.Component.extend({

//   options: {
//     children: {
//       "seekBar": {}
//     }
//   },

//   createEl: function(){
//     return this._super("div", {
//       className: "vjs-progress-control vjs-control"
//     });
//   }

// });

// // Seek Bar and holder for the progress bars
// _V_.SeekBar = _V_.Slider.extend({

//   options: {
//     children: {
//       "loadProgressBar": {},

//       // Set property names to bar and handle to match with the parent Slider class is looking for
//       "bar": { componentClass: "PlayProgressBar" },
//       "handle": { componentClass: "SeekHandle" }
//     }
//   },

//   playerEvent: "timeupdate",

//   init: function(player, options){
//     this._super(player, options);
//   },

//   createEl: function(){
//     return this._super("div", {
//       className: "vjs-progress-holder"
//     });
//   },

//   getPercent: function(){
//     return this.player.currentTime() / this.player.duration();
//   },

//   onMouseDown: function(event){
//     this._super(event);

//     this.player.scrubbing = true;

//     this.videoWasPlaying = !this.player.paused();
//     this.player.pause();
//   },

//   onMouseMove: function(event){
//     var newTime = this.calculateDistance(event) * this.player.duration();

//     // Don't let video end while scrubbing.
//     if (newTime == this.player.duration()) { newTime = newTime - 0.1; }

//     // Set new time (tell player to seek to new time)
//     this.player.currentTime(newTime);
//   },

//   onMouseUp: function(event){
//     this._super(event);

//     this.player.scrubbing = false;
//     if (this.videoWasPlaying) {
//       this.player.play();
//     }
//   },

//   stepForward: function(){
//     this.player.currentTime(this.player.currentTime() + 1);
//   },

//   stepBack: function(){
//     this.player.currentTime(this.player.currentTime() - 1);
//   }

// });

// // Load Progress Bar
// _V_.LoadProgressBar = _V_.Component.extend({

//   init: function(player, options){
//     this._super(player, options);
//     player.on("progress", _V_.bind(this, this.update));
//   },

//   createEl: function(){
//     return this._super("div", {
//       className: "vjs-load-progress",
//       innerHTML: '<span class="vjs-control-text">Loaded: 0%</span>'
//     });
//   },

//   update: function(){
//     if (this.el_.style) { this.el_.style.width = _V_.round(this.player.bufferedPercent() * 100, 2) + "%"; }
//   }

// });

// // Play Progress Bar
// _V_.PlayProgressBar = _V_.Component.extend({

//   createEl: function(){
//     return this._super("div", {
//       className: "vjs-play-progress",
//       innerHTML: '<span class="vjs-control-text">Progress: 0%</span>'
//     });
//   }

// });

// // Seek Handle
// // SeekBar Behavior includes play progress bar, and seek handle
// // Needed so it can determine seek position based on handle position/size
// _V_.SeekHandle = _V_.Component.extend({

//   createEl: function(){
//     return this._super("div", {
//       className: "vjs-seek-handle",
//       innerHTML: '<span class="vjs-control-text">00:00</span>'
//     });
//   }

// });

// /* Volume Scrubber
// ================================================================================ */
// // Progress Control: Seek, Load Progress, and Play Progress
// _V_.VolumeControl = _V_.Component.extend({

//   options: {
//     children: {
//       "volumeBar": {}
//     }
//   },

//   createEl: function(){
//     return this._super("div", {
//       className: "vjs-volume-control vjs-control"
//     });
//   }

// });

// _V_.VolumeBar = _V_.Slider.extend({

//   options: {
//     children: {
//       "bar": { componentClass: "VolumeLevel" },
//       "handle": { componentClass: "VolumeHandle" }
//     }
//   },

//   playerEvent: "volumechange",

//   createEl: function(){
//     return this._super("div", {
//       className: "vjs-volume-bar"
//     });
//   },

//   onMouseMove: function(event) {
//     this.player.volume(this.calculateDistance(event));
//   },

//   getPercent: function(){
//    return this.player.volume();
//   },

//   stepForward: function(){
//     this.player.volume(this.player.volume() + 0.1);
//   },

//   stepBack: function(){
//     this.player.volume(this.player.volume() - 0.1);
//   }
// });

// _V_.VolumeLevel = _V_.Component.extend({

//   createEl: function(){
//     return this._super("div", {
//       className: "vjs-volume-level",
//       innerHTML: '<span class="vjs-control-text"></span>'
//     });
//   }

// });

// _V_.VolumeHandle = _V_.Component.extend({

//   createEl: function(){
//     return this._super("div", {
//       className: "vjs-volume-handle",
//       innerHTML: '<span class="vjs-control-text"></span>'
//       // tabindex: 0,
//       // role: "slider", "aria-valuenow": 0, "aria-valuemin": 0, "aria-valuemax": 100
//     });
//   }

// });

// _V_.MuteToggle = _V_.Button.extend({

//   init: function(player, options){
//     this._super(player, options);

//     player.on("volumechange", _V_.bind(this, this.update));
//   },

//   createEl: function(){
//     return this._super("div", {
//       className: "vjs-mute-control vjs-control",
//       innerHTML: '<div><span class="vjs-control-text">Mute</span></div>'
//     });
//   },

//   onClick: function(event){
//     this.player.muted( this.player.muted() ? false : true );
//   },

//   update: function(event){
//     var vol = this.player.volume(),
//         level = 3;

//     if (vol == 0 || this.player.muted()) {
//       level = 0;
//     } else if (vol < 0.33) {
//       level = 1;
//     } else if (vol < 0.67) {
//       level = 2;
//     }

//     /* TODO improve muted icon classes */
//     _V_.each.call(this, [0,1,2,3], function(i){
//       _V_.removeClass(this.el, "vjs-vol-"+i);
//     });
//     _V_.addClass(this.el, "vjs-vol-"+level);
//   }

// });


// /* Poster Image
// ================================================================================ */
// _V_.PosterImage = _V_.Button.extend({
//   init: function(player, options){
//     this._super(player, options);

//     if (!this.player.options.poster) {
//       this.hide();
//     }

//     player.on("play", _V_.bind(this, this.hide));
//   },

//   createEl: function(){
//     return _V_.createEl("img", {
//       className: "vjs-poster",
//       src: this.player.options.poster,

//       // Don't want poster to be tabbable.
//       tabIndex: -1
//     });
//   },

//   onClick: function(){
//     this.player.play();
//   }
// });

// /* Menu
// ================================================================================ */
// // The base for text track and settings menu buttons.
// _V_.Menu = _V_.Component.extend({

//   init: function(player, options){
//     this._super(player, options);
//   },

//   addItem: function(component){
//     this.addChild(component);
//     component.on("click", _V_.bind(this, function(){
//       this.unlockShowing();
//     }));
//   },

//   createEl: function(){
//     return this._super("ul", {
//       className: "vjs-menu"
//     });
//   }

// });

// _V_.MenuItem = _V_.Button.extend({

//   init: function(player, options){
//     this._super(player, options);

//     if (options.selected) {
//       this.addClass("vjs-selected");
//     }
//   },

//   createEl: function(type, attrs){
//     return this._super("li", _V_.merge({
//       className: "vjs-menu-item",
//       innerHTML: this.options.label
//     }, attrs));
//   },

//   onClick: function(){
//     this.selected(true);
//   },

//   selected: function(selected){
//     if (selected) {
//       this.addClass("vjs-selected");
//     } else {
//       this.removeClass("vjs-selected")
//     }
//   }

// });

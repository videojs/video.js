/**
 * @fileoverview Controls classes for Video.js buttons, sliders, etc.
 */

/**
 * Base class for all control elements
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.Control = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(vjs.Control, vjs.Component);

vjs.Control.prototype.buildCSSClass = function(){
  return 'vjs-control ' + goog.base(this, 'buildCSSClass');
};

/* Control Bar
================================================================================ */
/**
 * Container of main controls
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.ControlBar = function(player, options){
  goog.base(this, player, options);

  player.one('play', vjs.bind(this, function(){
    this.fadeIn();
    this.player_.on('mouseover', vjs.bind(this, this.fadeIn));
    this.player_.on('mouseout', vjs.bind(this, this.fadeOut));
  }));
};
goog.inherits(vjs.ControlBar, vjs.Component);

vjs.ControlBar.prototype.options_ = {
  loadEvent: 'play',
  children: {
    'playToggle': {},
    'currentTimeDisplay': {},
    'timeDivider': {},
    'durationDisplay': {},
    'remainingTimeDisplay': {},
    'progressControl': {},
    'fullscreenToggle': {},
    'volumeControl': {},
    'muteToggle': {}
  }
};

vjs.ControlBar.prototype.createEl = function(){
  return vjs.createEl('div', {
    className: 'vjs-control-bar'
  });
};

vjs.ControlBar.prototype.fadeIn = function(){
  goog.base(this, 'fadeIn');
  this.player_.trigger('controlsvisible');
};

vjs.ControlBar.prototype.fadeOut = function(){
  goog.base(this, 'fadeOut');
  this.player_.trigger('controlshidden');
};

vjs.ControlBar.prototype.lockShowing = function(){
  this.el_.style.opacity = '1';
};

/* Button - Base class for all buttons
================================================================================ */
/**
 * Base class for all buttons
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.Button = function(player, options){
  goog.base(this, player, options);

  this.on('click', this.onClick);
  this.on('focus', this.onFocus);
  this.on('blur', this.onBlur);
};
goog.inherits(vjs.Button, vjs.Control);

vjs.Button.prototype.createEl = function(type, props){
  // Add standard Aria and Tabindex info
  props = vjs.obj.merge({
    className: this.buildCSSClass(),
    innerHTML: '<div><span class="vjs-control-text">' + (this.buttonText || 'Need Text') + '</span></div>',
    role: 'button',
    'aria-live': 'polite', // let the screen reader user know that the text of the button may change
    tabIndex: 0
  }, props);

  return goog.base(this, 'createEl', type, props);
};

  // Click - Override with specific functionality for button
vjs.Button.prototype.onClick = function(){};

  // Focus - Add keyboard functionality to element
vjs.Button.prototype.onFocus = function(){
  vjs.on(document, 'keyup', vjs.bind(this, this.onKeyPress));
};

  // KeyPress (document level) - Trigger click when keys are pressed
vjs.Button.prototype.onKeyPress = function(event){
  // Check for space bar (32) or enter (13) keys
  if (event.which == 32 || event.which == 13) {
    event.preventDefault();
    this.onClick();
  }
};

  // Blur - Remove keyboard triggers
vjs.Button.prototype.onBlur = function(){
  vjs.off(document, 'keyup', vjs.bind(this, this.onKeyPress));
};

/* Play Button
================================================================================ */
/**
 * Basic play button
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.PlayButton = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(vjs.PlayButton, vjs.Button);

vjs.PlayButton.prototype.buttonText = 'Play';

vjs.PlayButton.prototype.buildCSSClass = function(){
  return 'vjs-play-button ' + goog.base(this, 'buildCSSClass');
};

vjs.PlayButton.prototype.onClick = function(){
  this.player_.play();
};

/* Pause Button
================================================================================ */
/**
 * Basic pause button
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.PauseButton = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(vjs.PauseButton, vjs.Button);

vjs.PauseButton.prototype.buttonText = 'Play';

vjs.PauseButton.prototype.buildCSSClass = function(){
  return 'vjs-pause-button ' + goog.base(this, 'buildCSSClass');
};

vjs.PauseButton.prototype.onClick = function(){
  this.player_.pause();
};

/* Play Toggle - Play or Pause Media
================================================================================ */
/**
 * Button to toggle between play and pause
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.PlayToggle = function(player, options){
  goog.base(this, player, options);

  player.on('play', vjs.bind(this, this.onPlay));
  player.on('pause', vjs.bind(this, this.onPause));
};
goog.inherits(vjs.PlayToggle, vjs.Button);

vjs.PlayToggle.prototype.buttonText = 'Play';

vjs.PlayToggle.prototype.buildCSSClass = function(){
  return 'vjs-play-control ' + goog.base(this, 'buildCSSClass');
};

  // OnClick - Toggle between play and pause
vjs.PlayToggle.prototype.onClick = function(){
  if (this.player_.paused()) {
    this.player_.play();
  } else {
    this.player_.pause();
  }
};

  // OnPlay - Add the vjs-playing class to the element so it can change appearance
vjs.PlayToggle.prototype.onPlay = function(){
  vjs.removeClass(this.el_, 'vjs-paused');
  vjs.addClass(this.el_, 'vjs-playing');
  this.el_.children[0].children[0].innerHTML = 'Pause'; // change the button text to "Pause"
};

  // OnPause - Add the vjs-paused class to the element so it can change appearance
vjs.PlayToggle.prototype.onPause = function(){
  vjs.removeClass(this.el_, 'vjs-playing');
  vjs.addClass(this.el_, 'vjs-paused');
  this.el_.children[0].children[0].innerHTML = 'Play'; // change the button text to "Play"
};


/* Fullscreen Toggle Behaviors
================================================================================ */
/**
 * Toggle fullscreen video
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.FullscreenToggle = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(vjs.FullscreenToggle, vjs.Button);

vjs.FullscreenToggle.prototype.buttonText = 'Fullscreen';

vjs.FullscreenToggle.prototype.buildCSSClass = function(){
  return 'vjs-fullscreen-control ' + goog.base(this, 'buildCSSClass');
};

vjs.FullscreenToggle.prototype.onClick = function(){
  if (!this.player_.isFullScreen) {
    this.player_.requestFullScreen();
    this.el_.children[0].children[0].innerHTML = 'Non-Fullscreen'; // change the button text to "Non-Fullscreen"
  } else {
    this.player_.cancelFullScreen();
    this.el_.children[0].children[0].innerHTML = 'Fullscreen'; // change the button to "Fullscreen"
  }
};


/* Big Play Button
================================================================================ */
/**
 * Initial play button. Shows before the video has played.
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.BigPlayButton = function(player, options){
  goog.base(this, player, options);

  player.on('play', vjs.bind(this, this.hide));
  // player.on('ended', vjs.bind(this, this.show));
};
goog.inherits(vjs.BigPlayButton, vjs.Button);

vjs.BigPlayButton.prototype.createEl = function(){
  return goog.base(this, 'createEl', 'div', {
    className: 'vjs-big-play-button',
    innerHTML: '<span></span>',
    'aria-label': 'play video'
  });
};

vjs.BigPlayButton.prototype.onClick = function(){
  // Go back to the beginning if big play button is showing at the end.
  // Have to check for current time otherwise it might throw a 'not ready' error.
  if(this.player_.currentTime()) {
    this.player_.currentTime(0);
  }
  this.player_.play();
};

/* Loading Spinner
================================================================================ */
/**
 * Loading spinner for waiting events
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.LoadingSpinner = function(player, options){
  goog.base(this, player, options);

  player.on('canplay', vjs.bind(this, this.hide));
  player.on('canplaythrough', vjs.bind(this, this.hide));
  player.on('playing', vjs.bind(this, this.hide));
  player.on('seeked', vjs.bind(this, this.hide));

  player.on('seeking', vjs.bind(this, this.show));

  // in some browsers seeking does not trigger the 'playing' event,
  // so we also need to trap 'seeked' if we are going to set a
  // 'seeking' event
  player.on('seeked', vjs.bind(this, this.hide));

  player.on('error', vjs.bind(this, this.show));

  // Not showing spinner on stalled any more. Browsers may stall and then not trigger any events that would remove the spinner.
  // Checked in Chrome 16 and Safari 5.1.2. http://help.videojs.com/discussions/problems/883-why-is-the-download-progress-showing
  // player.on('stalled', vjs.bind(this, this.show));

  player.on('waiting', vjs.bind(this, this.show));
};
goog.inherits(vjs.LoadingSpinner, vjs.Component);

vjs.LoadingSpinner.prototype.createEl = function(){
  var classNameSpinner, innerHtmlSpinner;

  if ( typeof this.player_.el().style.WebkitBorderRadius == 'string'
       || typeof this.player_.el().style.MozBorderRadius == 'string'
       || typeof this.player_.el().style.KhtmlBorderRadius == 'string'
       || typeof this.player_.el().style.borderRadius == 'string')
    {
      classNameSpinner = 'vjs-loading-spinner';
      innerHtmlSpinner = '<div class="ball1"></div><div class="ball2"></div><div class="ball3"></div><div class="ball4"></div><div class="ball5"></div><div class="ball6"></div><div class="ball7"></div><div class="ball8"></div>';
    } else {
      classNameSpinner = 'vjs-loading-spinner-fallback';
      innerHtmlSpinner = '';
    }

  return goog.base(this, 'createEl', 'div', {
    className: classNameSpinner,
    innerHTML: innerHtmlSpinner
  });
};

/* Time
================================================================================ */

/**
 * Displays the current time
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.CurrentTimeDisplay = function(player, options){
  goog.base(this, player, options);

  player.on('timeupdate', vjs.bind(this, this.updateContent));
};
goog.inherits(vjs.CurrentTimeDisplay, vjs.Component);

vjs.CurrentTimeDisplay.prototype.createEl = function(){
  var el = goog.base(this, 'createEl', 'div', {
    className: 'vjs-current-time vjs-time-controls vjs-control'
  });

  this.content = vjs.createEl('div', {
    className: 'vjs-current-time-display',
    innerHTML: '<span class="vjs-control-text">Current Time </span>' + '0:00', // label the current time for screen reader users
    'aria-live': 'off' // tell screen readers not to automatically read the time as it changes
  });

  el.appendChild(vjs.createEl('div').appendChild(this.content));
  return el;
};

vjs.CurrentTimeDisplay.prototype.updateContent = function(){
  // Allows for smooth scrubbing, when player can't keep up.
  var time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
  this.content.innerHTML = '<span class="vjs-control-text">Current Time </span>' + vjs.formatTime(time, this.player_.duration());
};

/**
 * Displays the duration
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.DurationDisplay = function(player, options){
  goog.base(this, player, options);

  player.on('timeupdate', vjs.bind(this, this.updateContent)); // this might need to be changes to 'durationchange' instead of 'timeupdate' eventually, however the durationchange event fires before this.player_.duration() is set, so the value cannot be written out using this method. Once the order of durationchange and this.player_.duration() being set is figured out, this can be updated.
};
goog.inherits(vjs.DurationDisplay, vjs.Component);

vjs.DurationDisplay.prototype.createEl = function(){
  var el = goog.base(this, 'createEl', 'div', {
    className: 'vjs-duration vjs-time-controls vjs-control'
  });

  this.content = vjs.createEl('div', {
    className: 'vjs-duration-display',
    innerHTML: '<span class="vjs-control-text">Duration Time </span>' + '-0:00', // label the duration time for screen reader users
    'aria-live': 'off' // tell screen readers not to automatically read the time as it changes
  });

  el.appendChild(vjs.createEl('div').appendChild(this.content));
  return el;
};

vjs.DurationDisplay.prototype.updateContent = function(){
  if (this.player_.duration()) {
      this.content.innerHTML = '<span class="vjs-control-text">Duration Time </span>' + '-' + vjs.formatTime(this.player_.duration()); // label the duration time for screen reader users
  }
};

/**
 * Time Separator (Not used in main skin, but still available, and could be used as a 'spare element')
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.TimeDivider = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(vjs.TimeDivider, vjs.Component);

vjs.TimeDivider.prototype.createEl = function(){
  return goog.base(this, 'createEl', 'div', {
    className: 'vjs-time-divider',
    innerHTML: '<div><span>/</span></div>'
  });
};

/**
 * Displays the time left in the video
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.RemainingTimeDisplay = function(player, options){
  goog.base(this, player, options);

  player.on('timeupdate', vjs.bind(this, this.updateContent));
};
goog.inherits(vjs.RemainingTimeDisplay, vjs.Component);


vjs.RemainingTimeDisplay.prototype.createEl = function(){
  var el = goog.base(this, 'createEl', 'div', {
    className: 'vjs-remaining-time vjs-time-controls vjs-control'
  });

  this.content = vjs.createEl('div', {
    className: 'vjs-remaining-time-display',
    innerHTML: '<span class="vjs-control-text">Remaining Time </span>' + '-0:00', // label the remaining time for screen reader users
    'aria-live': 'off' // tell screen readers not to automatically read the time as it changes
  });

  el.appendChild(vjs.createEl('div').appendChild(this.content));
  return el;
};

vjs.RemainingTimeDisplay.prototype.updateContent = function(){
  if (this.player_.duration()) {
      if (this.player_.duration()) {
          this.content.innerHTML = '<span class="vjs-control-text">Remaining Time </span>' + '-'+ vjs.formatTime(this.player_.remainingTime());
      }
  }

  // Allows for smooth scrubbing, when player can't keep up.
  // var time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
  // this.content.innerHTML = vjs.formatTime(time, this.player_.duration());
};

/* Slider
================================================================================ */
/**
 * Parent for seek bar and volume slider
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.Slider = function(player, options){
    goog.base(this, player, options);

    // Set property names to bar and handle to match with the child Slider class is looking for
    this.bar = this.getChild(this.options_['barName']);
    this.handle = this.getChild(this.options_['handleName']);

    // console.log('asdf', this.bar, this.childNameIndex_, this.options_)

    player.on(this.playerEvent, vjs.bind(this, this.update));

    this.on('mousedown', this.onMouseDown);
    this.on('focus', this.onFocus);
    this.on('blur', this.onBlur);

    this.player_.on('controlsvisible', vjs.bind(this, this.update));

    // This is actually to fix the volume handle position. http://twitter.com/#!/gerritvanaaken/status/159046254519787520
    // this.player_.one('timeupdate', vjs.bind(this, this.update));

    player.ready(vjs.bind(this, this.update));
};
goog.inherits(vjs.Slider, vjs.Component);

vjs.Slider.prototype.createEl = function(type, props) {
  props = vjs.obj.merge({
    role: 'slider',
    'aria-valuenow': 0,
    'aria-valuemin': 0,
    'aria-valuemax': 100,
    tabIndex: 0
  }, props);

  return goog.base(this, 'createEl', type, props);
};

vjs.Slider.prototype.onMouseDown = function(event){
  event.preventDefault();
  vjs.blockTextSelection();

  vjs.on(document, 'mousemove', vjs.bind(this, this.onMouseMove));
  vjs.on(document, 'mouseup', vjs.bind(this, this.onMouseUp));

  this.onMouseMove(event);
};

vjs.Slider.prototype.onMouseUp = function() {
  vjs.unblockTextSelection();
  vjs.off(document, 'mousemove', this.onMouseMove, false);
  vjs.off(document, 'mouseup', this.onMouseUp, false);

  this.update();
};

vjs.Slider.prototype.update = function(){
  // In VolumeBar init we have a setTimeout for update that pops and update to the end of the
  // execution stack. The player is destroyed before then update will cause an error
  if (!this.el_) return;

  // If scrubbing, we could use a cached value to make the handle keep up with the user's mouse.
  // On HTML5 browsers scrubbing is really smooth, but some flash players are slow, so we might want to utilize this later.
  // var progress =  (this.player_.scrubbing) ? this.player_.getCache().currentTime / this.player_.duration() : this.player_.currentTime() / this.player_.duration();

  var barProgress,
      progress = this.getPercent(),
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

        handleWidth = handle.el().offsetWidth,

        // The width of the handle in percent of the containing box
        // In IE, widths may not be ready yet causing NaN
        handlePercent = (handleWidth) ? handleWidth / boxWidth : 0,

        // Get the adjusted size of the box, considering that the handle's center never touches the left or right side.
        // There is a margin of half the handle's width on both sides.
        boxAdjustedPercent = 1 - handlePercent,

        // Adjust the progress that we'll use to set widths to the new adjusted box width
        adjustedProgress = progress * boxAdjustedPercent;

    // The bar does reach the left side, so we need to account for this in the bar's width
    barProgress = adjustedProgress + (handlePercent / 2);

    // Move the handle from the left based on the adjected progress
    handle.el().style.left = vjs.round(adjustedProgress * 100, 2) + '%';
  }

  // Set the new bar width
  bar.el().style.width = vjs.round(barProgress * 100, 2) + '%';
};

vjs.Slider.prototype.calculateDistance = function(event){
  var box = this.el_,
      boxX = vjs.findPosX(box),
      boxW = box.offsetWidth,
      handle = this.handle;

  if (handle) {
    var handleW = handle.el().offsetWidth;

    // Adjusted X and Width, so handle doesn't go outside the bar
    boxX = boxX + (handleW / 2);
    boxW = boxW - handleW;
  }

  // Percent that the click is through the adjusted area
  return Math.max(0, Math.min(1, (event.pageX - boxX) / boxW));
};

vjs.Slider.prototype.onFocus = function(){
  vjs.on(document, 'keyup', vjs.bind(this, this.onKeyPress));
};

vjs.Slider.prototype.onKeyPress = function(event){
  if (event.which == 37) { // Left Arrow
    event.preventDefault();
    this.stepBack();
  } else if (event.which == 39) { // Right Arrow
    event.preventDefault();
    this.stepForward();
  }
};

vjs.Slider.prototype.onBlur = function(){
  vjs.off(document, 'keyup', vjs.bind(this, this.onKeyPress));
};


/* Progress
================================================================================ */

/**
 * Seek, Load Progress, and Play Progress
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.ProgressControl = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(vjs.ProgressControl, vjs.Component);

vjs.ProgressControl.prototype.options_ = {
  children: {
    'seekBar': {}
  }
};

vjs.ProgressControl.prototype.createEl = function(){
  return goog.base(this, 'createEl', 'div', {
    className: 'vjs-progress-control vjs-control'
  });
};

/**
 * Seek Bar and holder for the progress bars
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.SeekBar = function(player, options){
  goog.base(this, player, options);
  player.on('timeupdate', vjs.bind(this, this.updateARIAAttributes));
  player.ready(vjs.bind(this, this.updateARIAAttributes));
};
goog.inherits(vjs.SeekBar, vjs.Slider);

vjs.SeekBar.prototype.options_ = {
  children: {
    'loadProgressBar': {},
    'playProgressBar': {},
    'seekHandle': {}
  },
  'barName': 'playProgressBar',
  'handleName': 'seekHandle'
};

vjs.SeekBar.prototype.playerEvent = 'timeupdate';

vjs.SeekBar.prototype.createEl = function(){
  return goog.base(this, 'createEl', 'div', {
    className: 'vjs-progress-holder',
    'aria-label': 'video progress bar'
  });
};

vjs.SeekBar.prototype.updateARIAAttributes = function(){
    // Allows for smooth scrubbing, when player can't keep up.
    var time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
    this.el_.setAttribute('aria-valuenow',vjs.round(this.getPercent()*100, 2)); // machine readable value of progress bar (percentage complete)
    this.el_.setAttribute('aria-valuetext',vjs.formatTime(time, this.player_.duration())); // human readable value of progress bar (time complete)
};

vjs.SeekBar.prototype.getPercent = function(){
  return this.player_.currentTime() / this.player_.duration();
};

vjs.SeekBar.prototype.onMouseDown = function(event){
  goog.base(this, 'onMouseDown', event);

  this.player_.scrubbing = true;

  this.videoWasPlaying = !this.player_.paused();
  this.player_.pause();
};

vjs.SeekBar.prototype.onMouseMove = function(event){
  var newTime = this.calculateDistance(event) * this.player_.duration();

  // Don't let video end while scrubbing.
  if (newTime == this.player_.duration()) { newTime = newTime - 0.1; }

  // Set new time (tell player to seek to new time)
  this.player_.currentTime(newTime);
};

vjs.SeekBar.prototype.onMouseUp = function(event){
  goog.base(this, 'onMouseUp', event);

  this.player_.scrubbing = false;
  if (this.videoWasPlaying) {
    this.player_.play();
  }
};

vjs.SeekBar.prototype.stepForward = function(){
  this.player_.currentTime(this.player_.currentTime() + 5); // more quickly fast forward for keyboard-only users
};

vjs.SeekBar.prototype.stepBack = function(){
  this.player_.currentTime(this.player_.currentTime() - 5); // more quickly rewind for keyboard-only users
};


/**
 * Shows load progres
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.LoadProgressBar = function(player, options){
  goog.base(this, player, options);
  player.on('progress', vjs.bind(this, this.update));
};
goog.inherits(vjs.LoadProgressBar, vjs.Component);

vjs.LoadProgressBar.prototype.createEl = function(){
  return goog.base(this, 'createEl', 'div', {
    className: 'vjs-load-progress',
    innerHTML: '<span class="vjs-control-text">Loaded: 0%</span>'
  });
};

vjs.LoadProgressBar.prototype.update = function(){
  if (this.el_.style) { this.el_.style.width = vjs.round(this.player_.bufferedPercent() * 100, 2) + '%'; }
};


/**
 * Shows play progress
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.PlayProgressBar = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(vjs.PlayProgressBar, vjs.Component);

vjs.PlayProgressBar.prototype.createEl = function(){
  return goog.base(this, 'createEl', 'div', {
    className: 'vjs-play-progress',
    innerHTML: '<span class="vjs-control-text">Progress: 0%</span>'
  });
};

/**
 * SeekBar Behavior includes play progress bar, and seek handle
 * Needed so it can determine seek position based on handle position/size
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.SeekHandle = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(vjs.SeekHandle, vjs.Component);

vjs.SeekHandle.prototype.createEl = function(){
  return goog.base(this, 'createEl', 'div', {
    className: 'vjs-seek-handle',
    innerHTML: '<span class="vjs-control-text">00:00</span>'
  });
};

/**
 * Control the volume
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.VolumeControl = function(player, options){
  goog.base(this, player, options);

  // hide volume controls when they're not supported by the current tech
  if (player.tech && player.tech.features.volumeControl === false) {
    this.hide();
  }
  player.on('loadstart', vjs.bind(this, function(){
    if (player.tech.features.volumeControl === false) {
      this.hide();
    } else {
      this.show();
    }
  }));
};
goog.inherits(vjs.VolumeControl, vjs.Component);

vjs.VolumeControl.prototype.options_ = {
  children: {
    'volumeBar': {}
  }
};

vjs.VolumeControl.prototype.createEl = function(){
  return goog.base(this, 'createEl', 'div', {
    className: 'vjs-volume-control vjs-control'
  });
};

/**
 * Contains volume level
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.VolumeBar = function(player, options){
  goog.base(this, player, options);
  player.on('volumechange', vjs.bind(this, this.updateARIAAttributes));
  player.ready(vjs.bind(this, this.updateARIAAttributes));
  setTimeout(vjs.bind(this, this.update), 0); // update when elements is in DOM
};
goog.inherits(vjs.VolumeBar, vjs.Slider);

vjs.VolumeBar.prototype.updateARIAAttributes = function(){
    // Current value of volume bar as a percentage
    this.el_.setAttribute('aria-valuenow',vjs.round(this.player_.volume()*100, 2));
    this.el_.setAttribute('aria-valuetext',vjs.round(this.player_.volume()*100, 2)+'%');
};

vjs.VolumeBar.prototype.options_ = {
  children: {
    'volumeLevel': {},
    'volumeHandle': {}
  },
  'barName': 'volumeLevel',
  'handleName': 'volumeHandle'
};

vjs.VolumeBar.prototype.playerEvent = 'volumechange';

vjs.VolumeBar.prototype.createEl = function(){
  return goog.base(this, 'createEl', 'div', {
    className: 'vjs-volume-bar',
    'aria-label': 'volume level'
  });
};

vjs.VolumeBar.prototype.onMouseMove = function(event) {
  this.player_.volume(this.calculateDistance(event));
};

vjs.VolumeBar.prototype.getPercent = function(){
   return this.player_.volume();
};

vjs.VolumeBar.prototype.stepForward = function(){
  this.player_.volume(this.player_.volume() + 0.1);
};

vjs.VolumeBar.prototype.stepBack = function(){
  this.player_.volume(this.player_.volume() - 0.1);
};

/**
 * Shows volume level
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.VolumeLevel = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(vjs.VolumeLevel, vjs.Component);

vjs.VolumeLevel.prototype.createEl = function(){
  return goog.base(this, 'createEl', 'div', {
    className: 'vjs-volume-level',
    innerHTML: '<span class="vjs-control-text"></span>'
  });
};

/**
 * Change volume level
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.VolumeHandle = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(vjs.VolumeHandle, vjs.Component);

vjs.VolumeHandle.prototype.createEl = function(){
  return goog.base(this, 'createEl', 'div', {
    className: 'vjs-volume-handle',
    innerHTML: '<span class="vjs-control-text"></span>'
    // tabindex: 0,
    // role: 'slider', 'aria-valuenow': 0, 'aria-valuemin': 0, 'aria-valuemax': 100
  });
};

/**
 * Mute the audio
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.MuteToggle = function(player, options){
  goog.base(this, player, options);

  player.on('volumechange', vjs.bind(this, this.update));

  // hide mute toggle if the current tech doesn't support volume control
  if (player.tech && player.tech.features.volumeControl === false) {
    this.hide();
  }
  player.on('loadstart', vjs.bind(this, function(){
    if (player.tech.features.volumeControl === false) {
      this.hide();
    } else {
      this.show();
    }
  }));
};
goog.inherits(vjs.MuteToggle, vjs.Button);

vjs.MuteToggle.prototype.createEl = function(){
  return goog.base(this, 'createEl', 'div', {
    className: 'vjs-mute-control vjs-control',
    innerHTML: '<div><span class="vjs-control-text">Mute</span></div>'
  });
};

vjs.MuteToggle.prototype.onClick = function(){
  this.player_.muted( this.player_.muted() ? false : true );
};

vjs.MuteToggle.prototype.update = function(){
  var vol = this.player_.volume(),
      level = 3;

  if (vol === 0 || this.player_.muted()) {
    level = 0;
  } else if (vol < 0.33) {
    level = 1;
  } else if (vol < 0.67) {
    level = 2;
  }

  // Don't rewrite the button text if the actual text doesn't change.
  // This causes unnecessary and confusing information for screen reader users.
  // This check is needed because this function gets called every time the volume level is changed.
  if(this.player_.muted()){
      if(this.el_.children[0].children[0].innerHTML!='Unmute'){
          this.el_.children[0].children[0].innerHTML = 'Unmute'; // change the button text to "Unmute"
      }
  } else {
      if(this.el_.children[0].children[0].innerHTML!='Mute'){
          this.el_.children[0].children[0].innerHTML = 'Mute'; // change the button text to "Mute"
      }
  }

  /* TODO improve muted icon classes */
  for (var i = 0; i < 4; i++) {
    vjs.removeClass(this.el_, 'vjs-vol-'+i);
  }
  vjs.addClass(this.el_, 'vjs-vol-'+level);
};

/* Poster Image
================================================================================ */
/**
 * Poster image. Shows before the video plays.
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.PosterImage = function(player, options){
  goog.base(this, player, options);

  if (!player.poster()) {
    this.hide();
  }

  player.on('play', vjs.bind(this, this.hide));
};
goog.inherits(vjs.PosterImage, vjs.Button);

vjs.PosterImage.prototype.createEl = function(){
  var el = vjs.createEl('div', {
        className: 'vjs-poster',
        
        // Don't want poster to be tabbable.
        tabIndex: -1
      }),
      poster = this.player_.poster();
  
  if (poster) {
    if ('backgroundSize' in el.style) {
      el.style.backgroundImage = 'url("' + poster + '")';
    } else {
      el.appendChild(vjs.createEl('img', { src: poster }));
    }
  }
  
  return el;
};

vjs.PosterImage.prototype.onClick = function(){
  this.player_.play();
};

/* Menu
================================================================================ */
/**
 * The base for text track and settings menu buttons.
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.Menu = function(player, options){
  goog.base(this, player, options);
};
goog.inherits(vjs.Menu, vjs.Component);

vjs.Menu.prototype.addItem = function(component){
  this.addChild(component);
  component.on('click', vjs.bind(this, function(){
    this.unlockShowing();
  }));
};

vjs.Menu.prototype.createEl = function(){
  return goog.base(this, 'createEl', 'ul', {
    className: 'vjs-menu'
  });
};

/**
 * Menu item
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.MenuItem = function(player, options){
  goog.base(this, player, options);

  if (options['selected']) {
    this.addClass('vjs-selected');
    this.el_.setAttribute('aria-selected',true);
  } else {
    this.el_.setAttribute('aria-selected',false);
  }
};
goog.inherits(vjs.MenuItem, vjs.Button);

vjs.MenuItem.prototype.createEl = function(type, props){
  return goog.base(this, 'createEl', 'li', vjs.obj.merge({
    className: 'vjs-menu-item',
    innerHTML: this.options_['label']
  }, props));
};

vjs.MenuItem.prototype.onClick = function(){
  this.selected(true);
};

vjs.MenuItem.prototype.selected = function(selected){
  if (selected) {
    this.addClass('vjs-selected');
    this.el_.setAttribute('aria-selected',true);
  } else {
    this.removeClass('vjs-selected');
    this.el_.setAttribute('aria-selected',false);
  }
};

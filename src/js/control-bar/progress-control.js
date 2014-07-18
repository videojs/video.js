var ProgressControl, SeekBar, LoadProgressBar, PlayProgressBar, SeekHandle, Component, vjslib, slider;

Component = require('../component.js');
vjslib = require('../lib.js');
slider = require('../slider.js');

/**
 * The Progress Control component contains the seek bar, load progress,
 * and play progress
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
ProgressControl = Component.extend({
  /** @constructor */
  init: function(player, options){
    Component.call(this, player, options);
  }
});

ProgressControl.prototype.options_ = {
  children: {
    'seekBar': {}
  }
};

ProgressControl.prototype.createEl = function(){
  return Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-progress-control vjs-control'
  });
};

/**
 * Seek Bar and holder for the progress bars
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
SeekBar = slider.Slider.extend({
  /** @constructor */
  init: function(player, options){
    slider.Slider.call(this, player, options);
    player.on('timeupdate', vjslib.bind(this, this.updateARIAAttributes));
    player.ready(vjslib.bind(this, this.updateARIAAttributes));
  }
});

SeekBar.prototype.options_ = {
  children: {
    'loadProgressBar': {},
    'playProgressBar': {},
    'seekHandle': {}
  },
  'barName': 'playProgressBar',
  'handleName': 'seekHandle'
};

SeekBar.prototype.playerEvent = 'timeupdate';

SeekBar.prototype.createEl = function(){
  return slider.Slider.prototype.createEl.call(this, 'div', {
    className: 'vjs-progress-holder',
    'aria-label': 'video progress bar'
  });
};

SeekBar.prototype.updateARIAAttributes = function(){
    // Allows for smooth scrubbing, when player can't keep up.
    var time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
    this.el_.setAttribute('aria-valuenow',vjslib.round(this.getPercent()*100, 2)); // machine readable value of progress bar (percentage complete)
    this.el_.setAttribute('aria-valuetext',vjslib.formatTime(time, this.player_.duration())); // human readable value of progress bar (time complete)
};

SeekBar.prototype.getPercent = function(){
  return this.player_.currentTime() / this.player_.duration();
};

SeekBar.prototype.onMouseDown = function(event){
  slider.Slider.prototype.onMouseDown.call(this, event);

  this.player_.scrubbing = true;

  this.videoWasPlaying = !this.player_.paused();
  this.player_.pause();
};

SeekBar.prototype.onMouseMove = function(event){
  var newTime = this.calculateDistance(event) * this.player_.duration();

  // Don't let video end while scrubbing.
  if (newTime == this.player_.duration()) { newTime = newTime - 0.1; }

  // Set new time (tell player to seek to new time)
  this.player_.currentTime(newTime);
};

SeekBar.prototype.onMouseUp = function(event){
  slider.Slider.prototype.onMouseUp.call(this, event);

  this.player_.scrubbing = false;
  if (this.videoWasPlaying) {
    this.player_.play();
  }
};

SeekBar.prototype.stepForward = function(){
  this.player_.currentTime(this.player_.currentTime() + 5); // more quickly fast forward for keyboard-only users
};

SeekBar.prototype.stepBack = function(){
  this.player_.currentTime(this.player_.currentTime() - 5); // more quickly rewind for keyboard-only users
};


/**
 * Shows load progress
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
LoadProgressBar = Component.extend({
  /** @constructor */
  init: function(player, options){
    Component.call(this, player, options);
    player.on('progress', vjslib.bind(this, this.update));
  }
});

LoadProgressBar.prototype.createEl = function(){
  return Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-load-progress',
    innerHTML: '<span class="vjs-control-text">Loaded: 0%</span>'
  });
};

LoadProgressBar.prototype.update = function(){
  if (this.el_.style) { this.el_.style.width = vjslib.round(this.player_.bufferedPercent() * 100, 2) + '%'; }
};


/**
 * Shows play progress
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
PlayProgressBar = Component.extend({
  /** @constructor */
  init: function(player, options){
    Component.call(this, player, options);
  }
});

PlayProgressBar.prototype.createEl = function(){
  return Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-play-progress',
    innerHTML: '<span class="vjs-control-text">Progress: 0%</span>'
  });
};

/**
 * The Seek Handle shows the current position of the playhead during playback,
 * and can be dragged to adjust the playhead.
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
SeekHandle = slider.SliderHandle.extend({
  init: function(player, options) {
    slider.SliderHandle.call(this, player, options);
    player.on('timeupdate', vjslib.bind(this, this.updateContent));
  }
});

/**
 * The default value for the handle content, which may be read by screen readers
 *
 * @type {String}
 * @private
 */
SeekHandle.prototype.defaultValue = '00:00';

/** @inheritDoc */
SeekHandle.prototype.createEl = function() {
  return slider.SliderHandle.prototype.createEl.call(this, 'div', {
    className: 'vjs-seek-handle',
    'aria-live': 'off'
  });
};

SeekHandle.prototype.updateContent = function() {
  var time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
  this.el_.innerHTML = '<span class="vjs-control-text">' + vjslib.formatTime(time, this.player_.duration()) + '</span>';
};

module.exports = {
  ProgressControl: ProgressControl,
  LoadProgressBar: LoadProgressBar,
  PlayProgressBar: PlayProgressBar,
  SeekBar: SeekBar,
  SeekHandle: SeekHandle
};


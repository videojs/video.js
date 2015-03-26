import Component from '../component';
import Slider, { SliderHandle } from '../slider';
import * as Lib from '../lib';

/**
 * The Progress Control component contains the seek bar, load progress,
 * and play progress
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
let ProgressControl = Component.extend({
  /** @constructor */
  init: function(player, options){
    Component.call(this, player, options);
  }
});

Component.registerComponent('ProgressControl', ProgressControl);

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
var SeekBar = Slider.extend({
  /** @constructor */
  init: function(player, options){
    Slider.call(this, player, options);
    this.on(player, 'timeupdate', this.updateARIAAttributes);
    player.ready(Lib.bind(this, this.updateARIAAttributes));
  }
});

Component.registerComponent('SeekBar', SeekBar);

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
  return Slider.prototype.createEl.call(this, 'div', {
    className: 'vjs-progress-holder',
    'aria-label': 'video progress bar'
  });
};

SeekBar.prototype.updateARIAAttributes = function(){
    // Allows for smooth scrubbing, when player can't keep up.
    let time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
    this.el_.setAttribute('aria-valuenow', Lib.round(this.getPercent()*100, 2)); // machine readable value of progress bar (percentage complete)
    this.el_.setAttribute('aria-valuetext', Lib.formatTime(time, this.player_.duration())); // human readable value of progress bar (time complete)
};

SeekBar.prototype.getPercent = function(){
  return this.player_.currentTime() / this.player_.duration();
};

SeekBar.prototype.onMouseDown = function(event){
  Slider.prototype.onMouseDown.call(this, event);

  this.player_.scrubbing = true;
  this.player_.addClass('vjs-scrubbing');

  this.videoWasPlaying = !this.player_.paused();
  this.player_.pause();
};

SeekBar.prototype.onMouseMove = function(event){
  let newTime = this.calculateDistance(event) * this.player_.duration();

  // Don't let video end while scrubbing.
  if (newTime == this.player_.duration()) { newTime = newTime - 0.1; }

  // Set new time (tell player to seek to new time)
  this.player_.currentTime(newTime);
};

SeekBar.prototype.onMouseUp = function(event){
  Slider.prototype.onMouseUp.call(this, event);

  this.player_.scrubbing = false;
  this.player_.removeClass('vjs-scrubbing');
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
var LoadProgressBar = Component.extend({
  /** @constructor */
  init: function(player, options){
    Component.call(this, player, options);
    this.on(player, 'progress', this.update);
  }
});

Component.registerComponent('LoadProgressBar', LoadProgressBar);

LoadProgressBar.prototype.createEl = function(){
  return Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-load-progress',
    innerHTML: '<span class="vjs-control-text"><span>' + this.localize('Loaded') + '</span>: 0%</span>'
  });
};

LoadProgressBar.prototype.update = function(){
  let buffered = this.player_.buffered();
  let duration = this.player_.duration();
  let bufferedEnd = this.player_.bufferedEnd();
  let children = this.el_.children;

  // get the percent width of a time compared to the total end
  let percentify = function (time, end){
    let percent = (time / end) || 0; // no NaN
    return (percent * 100) + '%';
  };

  // update the width of the progress bar
  this.el_.style.width = percentify(bufferedEnd, duration);

  // add child elements to represent the individual buffered time ranges
  for (let i = 0; i < buffered.length; i++) {
    let start = buffered.start(i);
    let end = buffered.end(i);
    let part = children[i];

    if (!part) {
      part = this.el_.appendChild(Lib.createEl());
    }

    // set the percent based on the width of the progress bar (bufferedEnd)
    part.style.left = percentify(start, bufferedEnd);
    part.style.width = percentify(end - start, bufferedEnd);
  }

  // remove unused buffered range elements
  for (let i = children.length; i > buffered.length; i--) {
    this.el_.removeChild(children[i-1]);
  }
};

/**
 * Shows play progress
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
var PlayProgressBar = Component.extend({
  /** @constructor */
  init: function(player, options){
    Component.call(this, player, options);
  }
});

Component.registerComponent('PlayProgressBar', PlayProgressBar);

PlayProgressBar.prototype.createEl = function(){
  return Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-play-progress',
    innerHTML: '<span class="vjs-control-text"><span>' + this.localize('Progress') + '</span>: 0%</span>'
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
var SeekHandle = SliderHandle.extend({
  init: function(player, options) {
    SliderHandle.call(this, player, options);
    this.on(player, 'timeupdate', this.updateContent);
  }
});

Component.registerComponent('SeekHandle', SeekHandle);

/**
 * The default value for the handle content, which may be read by screen readers
 *
 * @type {String}
 * @private
 */
SeekHandle.prototype.defaultValue = '00:00';

/** @inheritDoc */
SeekHandle.prototype.createEl = function() {
  return SliderHandle.prototype.createEl.call(this, 'div', {
    className: 'vjs-seek-handle',
    'aria-live': 'off'
  });
};

SeekHandle.prototype.updateContent = function() {
  let time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
  this.el_.innerHTML = '<span class="vjs-control-text">' + Lib.formatTime(time, this.player_.duration()) + '</span>';
};

export default ProgressControl;
export { SeekBar, LoadProgressBar, PlayProgressBar, SeekHandle };

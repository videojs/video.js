var CurrentTimeDisplay, DurationDisplay, TimeDivider, RemainingTimeDisplay, Component, vjslib;

Component = require('../component.js');
vjslib = require('../lib.js');

/**
 * Displays the current time
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
CurrentTimeDisplay = Component.extend({
  /** @constructor */
  init: function(player, options){
    Component.call(this, player, options);

    player.on('timeupdate', vjslib.bind(this, this.updateContent));
  }
});

CurrentTimeDisplay.prototype.createEl = function(){
  var el = Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-current-time vjs-time-controls vjs-control'
  });

  this.contentEl_ = vjslib.createEl('div', {
    className: 'vjs-current-time-display',
    innerHTML: '<span class="vjs-control-text">Current Time </span>' + '0:00', // label the current time for screen reader users
    'aria-live': 'off' // tell screen readers not to automatically read the time as it changes
  });

  el.appendChild(this.contentEl_);
  return el;
};

CurrentTimeDisplay.prototype.updateContent = function(){
  // Allows for smooth scrubbing, when player can't keep up.
  var time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
  this.contentEl_.innerHTML = '<span class="vjs-control-text">Current Time </span>' + vjslib.formatTime(time, this.player_.duration());
};

/**
 * Displays the duration
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
DurationDisplay = Component.extend({
  /** @constructor */
  init: function(player, options){
    Component.call(this, player, options);

    // this might need to be changed to 'durationchange' instead of 'timeupdate' eventually,
    // however the durationchange event fires before this.player_.duration() is set,
    // so the value cannot be written out using this method.
    // Once the order of durationchange and this.player_.duration() being set is figured out,
    // this can be updated.
    player.on('timeupdate', vjslib.bind(this, this.updateContent));
  }
});

DurationDisplay.prototype.createEl = function(){
  var el = Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-duration vjs-time-controls vjs-control'
  });

  this.contentEl_ = vjslib.createEl('div', {
    className: 'vjs-duration-display',
    innerHTML: '<span class="vjs-control-text">Duration Time </span>' + '0:00', // label the duration time for screen reader users
    'aria-live': 'off' // tell screen readers not to automatically read the time as it changes
  });

  el.appendChild(this.contentEl_);
  return el;
};

DurationDisplay.prototype.updateContent = function(){
  var duration = this.player_.duration();
  if (duration) {
      this.contentEl_.innerHTML = '<span class="vjs-control-text">Duration Time </span>' + vjslib.formatTime(duration); // label the duration time for screen reader users
  }
};

/**
 * The separator between the current time and duration
 *
 * Can be hidden if it's not needed in the design.
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
TimeDivider = Component.extend({
  /** @constructor */
  init: function(player, options){
    Component.call(this, player, options);
  }
});

TimeDivider.prototype.createEl = function(){
  return Component.prototype.createEl.call(this, 'div', {
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
RemainingTimeDisplay = Component.extend({
  /** @constructor */
  init: function(player, options){
    Component.call(this, player, options);

    player.on('timeupdate', vjslib.bind(this, this.updateContent));
  }
});

RemainingTimeDisplay.prototype.createEl = function(){
  var el = Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-remaining-time vjs-time-controls vjs-control'
  });

  this.contentEl_ = vjslib.createEl('div', {
    className: 'vjs-remaining-time-display',
    innerHTML: '<span class="vjs-control-text">Remaining Time </span>' + '-0:00', // label the remaining time for screen reader users
    'aria-live': 'off' // tell screen readers not to automatically read the time as it changes
  });

  el.appendChild(this.contentEl_);
  return el;
};

RemainingTimeDisplay.prototype.updateContent = function(){
  if (this.player_.duration()) {
    this.contentEl_.innerHTML = '<span class="vjs-control-text">Remaining Time </span>' + '-'+ vjslib.formatTime(this.player_.remainingTime());
  }

  // Allows for smooth scrubbing, when player can't keep up.
  // var time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
  // this.contentEl_.innerHTML = vjs.formatTime(time, this.player_.duration());
};

module.exports = {
  CurrentTimeDisplay: CurrentTimeDisplay,
  DurationDisplay: DurationDisplay,
  TimeDivider: TimeDivider,
  RemainingTimeDisplay: RemainingTimeDisplay
};

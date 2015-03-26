import Component from '../component';
import * as Lib from '../lib';

/**
 * Displays the current time
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
let CurrentTimeDisplay = Component.extend({
  /** @constructor */
  init: function(player, options){
    Component.call(this, player, options);

    this.on(player, 'timeupdate', this.updateContent);
  }
});

Component.registerComponent('CurrentTimeDisplay', CurrentTimeDisplay);

CurrentTimeDisplay.prototype.createEl = function(){
  let el = Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-current-time vjs-time-controls vjs-control'
  });

  this.contentEl_ = Lib.createEl('div', {
    className: 'vjs-current-time-display',
    innerHTML: '<span class="vjs-control-text">Current Time </span>' + '0:00', // label the current time for screen reader users
    'aria-live': 'off' // tell screen readers not to automatically read the time as it changes
  });

  el.appendChild(this.contentEl_);
  return el;
};

CurrentTimeDisplay.prototype.updateContent = function(){
  // Allows for smooth scrubbing, when player can't keep up.
  let time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
  this.contentEl_.innerHTML = '<span class="vjs-control-text">' + this.localize('Current Time') + '</span> ' + Lib.formatTime(time, this.player_.duration());
};

/**
 * Displays the duration
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
var DurationDisplay = Component.extend({
  /** @constructor */
  init: function(player, options){
    Component.call(this, player, options);

    // this might need to be changed to 'durationchange' instead of 'timeupdate' eventually,
    // however the durationchange event fires before this.player_.duration() is set,
    // so the value cannot be written out using this method.
    // Once the order of durationchange and this.player_.duration() being set is figured out,
    // this can be updated.
    this.on(player, 'timeupdate', this.updateContent);
  }
});

Component.registerComponent('DurationDisplay', DurationDisplay);

DurationDisplay.prototype.createEl = function(){
  let el = Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-duration vjs-time-controls vjs-control'
  });

  this.contentEl_ = Lib.createEl('div', {
    className: 'vjs-duration-display',
    innerHTML: '<span class="vjs-control-text">' + this.localize('Duration Time') + '</span> ' + '0:00', // label the duration time for screen reader users
    'aria-live': 'off' // tell screen readers not to automatically read the time as it changes
  });

  el.appendChild(this.contentEl_);
  return el;
};

DurationDisplay.prototype.updateContent = function(){
  let duration = this.player_.duration();
  if (duration) {
    this.contentEl_.innerHTML = '<span class="vjs-control-text">' + this.localize('Duration Time') + '</span> ' + Lib.formatTime(duration); // label the duration time for screen reader users
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
var TimeDivider = Component.extend({
  /** @constructor */
  init: function(player, options){
    Component.call(this, player, options);
  }
});

Component.registerComponent('TimeDivider', TimeDivider);

TimeDivider.prototype.createEl = function(){
  return Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-time-divider',
    innerHTML: '<div><span>/</span></div>'
  });
};

/**
 * Displays the time left in the video
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */
var RemainingTimeDisplay = Component.extend({
  /** @constructor */
  init: function(player, options){
    Component.call(this, player, options);

    this.on(player, 'timeupdate', this.updateContent);
  }
});

Component.registerComponent('RemainingTimeDisplay', RemainingTimeDisplay);

RemainingTimeDisplay.prototype.createEl = function(){
  let el = Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-remaining-time vjs-time-controls vjs-control'
  });

  this.contentEl_ = Lib.createEl('div', {
    className: 'vjs-remaining-time-display',
    innerHTML: '<span class="vjs-control-text">' + this.localize('Remaining Time') + '</span> ' + '-0:00', // label the remaining time for screen reader users
    'aria-live': 'off' // tell screen readers not to automatically read the time as it changes
  });

  el.appendChild(this.contentEl_);
  return el;
};

RemainingTimeDisplay.prototype.updateContent = function(){
  if (this.player_.duration()) {
    this.contentEl_.innerHTML = '<span class="vjs-control-text">' + this.localize('Remaining Time') + '</span> ' + '-'+ Lib.formatTime(this.player_.remainingTime());
  }

  // Allows for smooth scrubbing, when player can't keep up.
  // var time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
  // this.contentEl_.innerHTML = vjs.formatTime(time, this.player_.duration());
};

export default CurrentTimeDisplay;
export { DurationDisplay, TimeDivider, RemainingTimeDisplay };

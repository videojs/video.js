var LoadingSpinner, Component, vjslib;

Component = require('./component.js');
vjslib = require('./lib.js');

/* Loading Spinner
================================================================================ */
/**
 * Loading spinner for waiting events
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */
LoadingSpinner = Component.extend({
  /** @constructor */
  init: function(player, options){
    Component.call(this, player, options);

    player.on('canplay', vjslib.bind(this, this.hide));
    player.on('canplaythrough', vjslib.bind(this, this.hide));
    player.on('playing', vjslib.bind(this, this.hide));
    player.on('seeking', vjslib.bind(this, this.show));

    // in some browsers seeking does not trigger the 'playing' event,
    // so we also need to trap 'seeked' if we are going to set a
    // 'seeking' event
    player.on('seeked', vjslib.bind(this, this.hide));

    player.on('ended', vjslib.bind(this, this.hide));

    // Not showing spinner on stalled any more. Browsers may stall and then not trigger any events that would remove the spinner.
    // Checked in Chrome 16 and Safari 5.1.2. http://help.videojs.com/discussions/problems/883-why-is-the-download-progress-showing
    // player.on('stalled', vjs.bind(this, this.show));

    player.on('waiting', vjslib.bind(this, this.show));
  }
});

LoadingSpinner.prototype.createEl = function(){
  return Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-loading-spinner'
  });
};

module.exports = LoadingSpinner;

/* Loading Spinner
================================================================================ */
/**
 * Loading spinner for waiting events
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.LoadingSpinner = vjs.Component.extend({
  /** @constructor */
  init: function(player, options){
    vjs.Component.call(this, player, options);

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
  }
});

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

  return vjs.Component.prototype.createEl.call(this, 'div', {
    className: classNameSpinner,
    innerHTML: innerHtmlSpinner
  });
};
/* Poster Image
================================================================================ */
/**
 * The component that handles showing the poster image.
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.PosterImage = vjs.Button.extend({
  /** @constructor */
  init: function(player, options){
    vjs.Button.call(this, player, options);

    if (player.poster()) {
      this.src(player.poster());
    }

    if (!player.poster() || !player.controls()) {
      this.hide();
    }

    player.on('posterchange', vjs.bind(this, function(){
      this.src(player.poster());
    }));

    player.on('play', vjs.bind(this, this.hide));
  }
});

// use the test el to check for backgroundSize style support
var _backgroundSizeSupported = 'backgroundSize' in vjs.TEST_VID.style;

vjs.PosterImage.prototype.createEl = function(){
  var el = vjs.createEl('div', {
    className: 'vjs-poster',

    // Don't want poster to be tabbable.
    tabIndex: -1
  });

  if (!_backgroundSizeSupported) {
    // setup an img element as a fallback for IE8
    el.appendChild(vjs.createEl('img'));
  }

  return el;
};

vjs.PosterImage.prototype.src = function(url){
  var el = this.el();

  // getter
  // can't think of a need for a getter here
  // see #838 if on is needed in the future
  // still don't want a getter to set src as undefined
  if (url === undefined) {
    return;
  }

  // setter
  // To ensure the poster image resizes while maintaining its original aspect
  // ratio, use a div with `background-size` when available. For browsers that
  // do not support `background-size` (e.g. IE8), fall back on using a regular
  // img element.
  if (_backgroundSizeSupported) {
    el.style.backgroundImage = 'url("' + url + '")';
  } else {
    el.firstChild.src = url;
  }
};

vjs.PosterImage.prototype.onClick = function(){
  // Only accept clicks when controls are enabled
  if (this.player().controls()) {
    this.player_.play();
  }
};

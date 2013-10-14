/* Poster Image
================================================================================ */

/**
 * Helper function to set the poster source. To ensure the poster image resizes
 * while maintaining its original aspect ratio, use a div with `background-size`
 * when available. For browsers that do not support `background-size` (e.g.
 * IE8), fall back on using a regular img element.
 */
var setSrc = function(el, src){
  if ('backgroundSize' in el.style) {
    el.style.backgroundImage = 'url("' + src + '")';
  } else {
    el.appendChild(vjs.createEl('img', { src: src }));
  }
};

/**
 * Poster image. Shows before the video plays.
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.PosterImage = vjs.Button.extend({
  /** @constructor */
  init: function(player, options){
    vjs.Button.call(this, player, options);

    if (!player.poster() || !player.controls()) {
      this.hide();
    }

    player.on('play', vjs.bind(this, this.hide));
  }
});

vjs.PosterImage.prototype.createEl = function(){
  var el = vjs.createEl('div', {
        className: 'vjs-poster',

        // Don't want poster to be tabbable.
        tabIndex: -1
      }),
      poster = this.player_.poster();

  if (poster) {
    setSrc(el, poster);
  }

  return el;
};

vjs.PosterImage.prototype.src = function(url){
  var el = this.el();

  // getter
  if (url === undefined) {
    if ('backgroundSize' in el.style) {
      return (/url\(['"]?(.*)['"]?\)/).exec(el.style.backgroundImage)[1];
    } else {
      return el.src;
    }
  }

  // setter
  setSrc(el, url);
};

vjs.PosterImage.prototype.onClick = function(){
  // Only accept clicks when controls are enabled
  if (this.player().controls()) {
    this.player_.play();
  }
};

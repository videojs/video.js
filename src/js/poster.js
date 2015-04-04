import Button from './button';
import * as Lib from './lib';
import Component from './component';

/* Poster Image
================================================================================ */
/**
 * The component that handles showing the poster image.
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
let PosterImage = Button.extend({
  /** @constructor */
  init: function(player, options){
    Button.call(this, player, options);

    this.update();
    player.on('posterchange', Lib.bind(this, this.update));
  }
});

Component.registerComponent('PosterImage', PosterImage);

/**
 * Clean up the poster image
 */
PosterImage.prototype.dispose = function(){
  this.player().off('posterchange', this.update);
  Button.prototype.dispose.call(this);
};

/**
 * Create the poster image element
 * @return {Element}
 */
PosterImage.prototype.createEl = function(){
  let el = Lib.createEl('div', {
    className: 'vjs-poster',

    // Don't want poster to be tabbable.
    tabIndex: -1
  });

  // To ensure the poster image resizes while maintaining its original aspect
  // ratio, use a div with `background-size` when available. For browsers that
  // do not support `background-size` (e.g. IE8), fall back on using a regular
  // img element.
  if (!Lib.BACKGROUND_SIZE_SUPPORTED) {
    this.fallbackImg_ = Lib.createEl('img');
    el.appendChild(this.fallbackImg_);
  }

  return el;
};

/**
 * Event handler for updates to the player's poster source
 */
PosterImage.prototype.update = function(){
  let url = this.player().poster();

  this.setSrc(url);

  // If there's no poster source we should display:none on this component
  // so it's not still clickable or right-clickable
  if (url) {
    this.show();
  } else {
    this.hide();
  }
};

/**
 * Set the poster source depending on the display method
 */
PosterImage.prototype.setSrc = function(url){
  if (this.fallbackImg_) {
    this.fallbackImg_.src = url;
  } else {
    let backgroundImage = '';
    // Any falsey values should stay as an empty string, otherwise
    // this will throw an extra error
    if (url) {
      backgroundImage = 'url("' + url + '")';
    }

    this.el_.style.backgroundImage = backgroundImage;
  }
};

/**
 * Event handler for clicks on the poster image
 */
PosterImage.prototype.onClick = function(){
  // We don't want a click to trigger playback when controls are disabled
  // but CSS should be hiding the poster to prevent that from happening
  this.player_.play();
};

export default PosterImage;

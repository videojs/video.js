import Button from './button';
import * as Lib from './lib';

/* Poster Image
================================================================================ */
/**
 * The component that handles showing the poster image.
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */
class PosterImage extends Button {

  constructor(player, options){
    super(player, options);

    this.update();
    player.on('posterchange', Lib.bind(this, this.update));
  }

  /**
   * Clean up the poster image
   */
  dispose() {
    this.player().off('posterchange', this.update);
    super.dispose();
  }

  /**
   * Create the poster image element
   * @return {Element}
   */
  createEl() {
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
  }

  /**
   * Event handler for updates to the player's poster source
   */
  update() {
    let url = this.player().poster();

    this.setSrc(url);

    // If there's no poster source we should display:none on this component
    // so it's not still clickable or right-clickable
    if (url) {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * Set the poster source depending on the display method
   */
  setSrc(url) {
    if (this.fallbackImg_) {
      this.fallbackImg_.src = url;
    } else {
      let backgroundImage = '';
      // Any falsey values should stay as an empty string, otherwise
      // this will throw an extra error
      if (url) {
        backgroundImage = `url("${url}")`;
      }

      this.el_.style.backgroundImage = backgroundImage;
    }
  }

  /**
   * Event handler for clicks on the poster image
   */
  onClick() {
    // We don't want a click to trigger playback when controls are disabled
    // but CSS should be hiding the poster to prevent that from happening
    this.player_.play();
  }

}

Button.registerComponent('PosterImage', PosterImage);
export default PosterImage;

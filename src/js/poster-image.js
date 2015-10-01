/**
 * @file poster-image.js
 */
import Button from './button.js';
import Component from './component.js';
import * as Fn from './utils/fn.js';
import * as Dom from './utils/dom.js';
import * as browser from './utils/browser.js';

/**
 * The component that handles showing the poster image.
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Button
 * @class PosterImage
 */
class PosterImage extends Button {

  constructor(player, options){
    super(player, options);

    this.update();
    player.on('posterchange', Fn.bind(this, this.update));
  }

  /**
   * Clean up the poster image
   *
   * @method dispose
   */
  dispose() {
    this.player().off('posterchange', this.update);
    super.dispose();
  }

  /**
   * Create the poster's image element
   *
   * @return {Element}
   * @method createEl
   */
  createEl() {
    let el = Dom.createEl('div', {
      className: 'vjs-poster',

      // Don't want poster to be tabbable.
      tabIndex: -1
    });

    // To ensure the poster image resizes while maintaining its original aspect
    // ratio, use a div with `background-size` when available. For browsers that
    // do not support `background-size` (e.g. IE8), fall back on using a regular
    // img element.
    if (!browser.BACKGROUND_SIZE_SUPPORTED) {
      this.fallbackImg_ = Dom.createEl('img');
      el.appendChild(this.fallbackImg_);
    }

    return el;
  }

  /**
   * Event handler for updates to the player's poster source
   *
   * @method update
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
   *
   * @param {String} url The URL to the poster source
   * @method setSrc
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
   *
   * @method handleClick
   */
  handleClick() {
    // We don't want a click to trigger playback when controls are disabled
    // but CSS should be hiding the poster to prevent that from happening
    if (this.player_.paused()) {
      this.player_.play();
    } else {
      this.player_.pause();
    }
  }

}

Component.registerComponent('PosterImage', PosterImage);
export default PosterImage;

/**
 * @file poster-image.js
 */
import ClickableComponent from './clickable-component.js';
import Component from './component.js';
import * as Dom from './utils/dom.js';
import {silencePromise} from './utils/promise';
import * as browser from './utils/browser.js';

/**
 * A `ClickableComponent` that handles showing the poster image for the player.
 *
 * @extends ClickableComponent
 */
class PosterImage extends ClickableComponent {

  /**
   * Create an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should attach to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  constructor(player, options) {
    super(player, options);

    this.update();

    this.update_ = (e) => this.update(e);
    player.on('posterchange', this.update_);
  }

  /**
   * Clean up and dispose of the `PosterImage`.
   */
  dispose() {
    this.player().off('posterchange', this.update_);
    super.dispose();
  }

  /**
   * Create the `PosterImage`s DOM element.
   *
   * @return {Element}
   *         The element that gets created.
   */
  createEl() {
    const el = Dom.createEl('div', {
      className: 'vjs-poster',

      // Don't want poster to be tabbable.
      tabIndex: -1
    });

    return el;
  }

  /**
   * An {@link EventTarget~EventListener} for {@link Player#posterchange} events.
   *
   * @listens Player#posterchange
   *
   * @param {EventTarget~Event} [event]
   *        The `Player#posterchange` event that triggered this function.
   */
  update(event) {
    const url = this.player().poster();

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
   * Set the source of the `PosterImage` depending on the display method.
   *
   * @param {string} url
   *        The URL to the source for the `PosterImage`.
   */
  setSrc(url) {
    let backgroundImage = '';

    // Any falsy value should stay as an empty string, otherwise
    // this will throw an extra error
    if (url) {
      backgroundImage = `url("${url}")`;
    }

    this.el_.style.backgroundImage = backgroundImage;
  }

  /**
   * An {@link EventTarget~EventListener} for clicks on the `PosterImage`. See
   * {@link ClickableComponent#handleClick} for instances where this will be triggered.
   *
   * @listens tap
   * @listens click
   * @listens keydown
   *
   * @param {EventTarget~Event} event
   +        The `click`, `tap` or `keydown` event that caused this function to be called.
   */
  handleClick(event) {
    // We don't want a click to trigger playback when controls are disabled
    if (!this.player_.controls()) {
      return;
    }

    const sourceIsEncrypted = this.player_.usingPlugin('eme') &&
                                this.player_.eme.sessions &&
                                this.player_.eme.sessions.length > 0;

    if (this.player_.tech(true) &&
    // We've observed a bug in IE and Edge when playing back DRM content where
    // calling .focus() on the video element causes the video to go black,
    // so we avoid it in that specific case
    !((browser.IE_VERSION || browser.IS_EDGE) && sourceIsEncrypted)) {
      this.player_.tech(true).focus();
    }

    if (this.player_.paused()) {
      silencePromise(this.player_.play());
    } else {
      this.player_.pause();
    }
  }

}

Component.registerComponent('PosterImage', PosterImage);
export default PosterImage;

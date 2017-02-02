/**
 * @file tracks-button.js
 */
import TextTrackButton from './text-track-button.js';
import Component from '../../component.js';
import CaptionSettingsMenuItem from './caption-settings-menu-item.js';

/**
 * The button component for toggling and selecting captions
 *
 * @extends TextTrackButton
 */
class SubsCapsButton extends TextTrackButton {

  constructor(player, options = {}) {
    super(player, options);

    // Although North America uses "captions" in most cases for
    // "captions and subtitles" other locales use "subtitles"
    this.label_ = 'Subtitles';
    if (['en', 'en-us', 'en-ca', 'fr-ca'].indexOf(this.player_.language_) > -1) {
      this.label_ = 'Captions';
    }

    /**
     * The text that should display over the `SubsCapsButton`s controls.
     *
     *
     * @type {string}
     * @private
     */
    SubsCapsButton.prototype.controlText_ = this.label_;
  }

  /**
   * Builds the default DOM `className`.
   *
   * @return {string}
   *         The DOM `className` for this object.
   */
  buildCSSClass() {
    return `vjs-subs-caps-button ${super.buildCSSClass()}`;
  }

  /**
   * Update caption menu items
   *
   * @param {EventTarget~Event} [event]
   *        The `addtrack` or `removetrack` event that caused this function to be
   *        called.
   *
   * @listens TextTrackList#addtrack
   * @listens TextTrackList#removetrack
   */
  update(event) {
    let threshold = 2;

    super.update();

    // if native, then threshold is 1 because no settings button
    if (this.player().tech_ && this.player().tech_.featuresNativeTextTracks) {
      threshold = 1;
    }

    if (this.items && this.items.length > threshold) {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * Create caption/subtitles menu items
   *
   * @return {CaptionSettingsMenuItem[]}
   *         The array of current menu items.
   */
  createItems() {
    let items = [];

    if (!(this.player().tech_ && this.player().tech_.featuresNativeTextTracks)) {
      items.push(new CaptionSettingsMenuItem(this.player_, {kind: this.label_}));
    }

    items = super.createItems(items);
    return items;
  }

}

/**
 * `kind`s of TextTrack to look for to associate it with this menu.
 *
 * @type {array}
 * @private
 */
SubsCapsButton.prototype.kinds_ = ['captions', 'subtitles'];

Component.registerComponent('SubsCapsButton', SubsCapsButton);
export default SubsCapsButton;

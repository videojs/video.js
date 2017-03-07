/**
 * @file sub-caps-button.js
 */
import TextTrackButton from './text-track-button.js';
import Component from '../../component.js';
import CaptionSettingsMenuItem from './caption-settings-menu-item.js';
import SubsCapsMenuItem from './subs-caps-menu-item.js';
import toTitleCase from '../../utils/to-title-case.js';
/**
 * The button component for toggling and selecting captions and/or subtitles
 *
 * @extends TextTrackButton
 */
class SubsCapsButton extends TextTrackButton {

  constructor(player, options = {}) {
    super(player, options);

    // Although North America uses "captions" in most cases for
    // "captions and subtitles" other locales use "subtitles"
    this.label_ = 'subtitles';
    if (['en', 'en-us', 'en-ca', 'fr-ca'].indexOf(this.player_.language_) > -1) {
      this.label_ = 'captions';
    }
    this.menuButton_.controlText(toTitleCase(this.label_));
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

  buildWrapperCSSClass() {
    return `vjs-subs-caps-button ${super.buildWrapperCSSClass()}`;
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

      this.hideThreshold_ += 1;
    }

    items = super.createItems(items, SubsCapsMenuItem);
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

/**
 * The text that should display over the `SubsCapsButton`s controls.
 *
 *
 * @type {string}
 * @private
 */
SubsCapsButton.prototype.controlText_ = 'Subtitles';

Component.registerComponent('SubsCapsButton', SubsCapsButton);
export default SubsCapsButton;

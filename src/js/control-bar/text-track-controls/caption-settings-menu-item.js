/**
 * @file caption-settings-menu-item.js
 */
import TextTrackMenuItem from './text-track-menu-item.js';
import Component from '../../component.js';

/**
 * The menu item for caption track settings menu
 *
 * @extends TextTrackMenuItem
 */
class CaptionSettingsMenuItem extends TextTrackMenuItem {

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  constructor(player, options) {
    options.track = {
      player,
      kind: options.kind,
      label: options.kind + ' settings',
      selectable: false,
      default: false,
      mode: 'disabled'
    };

    // CaptionSettingsMenuItem has no concept of 'selected'
    options.selectable = false;

    super(player, options);
    this.addClass('vjs-texttrack-settings');
    this.controlText(', opens ' + options.kind + ' settings dialog');
  }

  /**
   * This gets called when an `CaptionSettingsMenuItem` is "clicked". See
   * {@link ClickableComponent} for more detailed information on what a click can be.
   *
   * @param {EventTarget~Event} [event]
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */
  handleClick(event) {
    this.player().getChild('textTrackSettings').show();
    this.player().getChild('textTrackSettings').el_.focus();
  }

}

Component.registerComponent('CaptionSettingsMenuItem', CaptionSettingsMenuItem);
export default CaptionSettingsMenuItem;

/**
 * @file caption-settings-menu-item.js
 */
import TextTrackMenuItem from './text-track-menu-item.js';
import Component from '../../component.js';

/**
 * The menu item for caption track settings menu
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends TextTrackMenuItem
 * @class CaptionSettingsMenuItem
 */
 class CaptionSettingsMenuItem extends TextTrackMenuItem {

  constructor(player, options) {
    options['track'] = {
      'kind': options['kind'],
      'player': player,
      'label': options['kind'] + ' settings',
      'selectable': false,
      'default': false,
      mode: 'disabled'
    };

    // CaptionSettingsMenuItem has no concept of 'selected'
    options['selectable'] = false;

    super(player, options);
    this.addClass('vjs-texttrack-settings');
    this.controlText(', opens ' + options['kind'] + ' settings dialog');
  }

  /**
   * Handle click on menu item
   *
   * @method handleClick
   */
  handleClick() {
    this.player().getChild('textTrackSettings').show();
    this.player().getChild('textTrackSettings').el_.focus();
  }

}

Component.registerComponent('CaptionSettingsMenuItem', CaptionSettingsMenuItem);
export default CaptionSettingsMenuItem;

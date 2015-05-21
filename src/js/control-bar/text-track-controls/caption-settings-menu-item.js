import TextTrackMenuItem from './text-track-menu-item.js';
import Component from '../../component.js';

class CaptionSettingsMenuItem extends TextTrackMenuItem {

  constructor(player, options) {
    options['track'] = {
      'kind': options['kind'],
      'player': player,
      'label': options['kind'] + ' settings',
      'default': false,
      mode: 'disabled'
    };

    super(player, options);
    this.addClass('vjs-texttrack-settings');
  }

  handleClick() {
    this.player().getChild('textTrackSettings').show();
  }

}

Component.registerComponent('CaptionSettingsMenuItem', CaptionSettingsMenuItem);
export default CaptionSettingsMenuItem;

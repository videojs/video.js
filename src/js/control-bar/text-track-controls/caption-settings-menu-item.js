import TextTrackMenuItem from './text-track-menu-item.js';

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

TextTrackMenuItem.registerComponent('CaptionSettingsMenuItem', CaptionSettingsMenuItem);
export default CaptionSettingsMenuItem;

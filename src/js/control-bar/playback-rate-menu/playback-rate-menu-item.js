import MenuItem from '../../menu/menu-item.js';
import Component from '../../component.js';

/**
 * The specific menu item type for selecting a playback rate
 *
 * @constructor
 */
class PlaybackRateMenuItem extends MenuItem {

  constructor(player, options){
    let label = options['rate'];
    let rate = parseFloat(label, 10);

    // Modify options for parent MenuItem class's init.
    options['label'] = label;
    options['selected'] = rate === 1;
    super(player, options);

    this.label = label;
    this.rate = rate;

    this.on(player, 'ratechange', this.update);
  }

  handleClick() {
    super.handleClick();
    this.player().playbackRate(this.rate);
  }

  update() {
    this.selected(this.player().playbackRate() === this.rate);
  }

}

PlaybackRateMenuItem.prototype.contentElType = 'button';

Component.registerComponent('PlaybackRateMenuItem', PlaybackRateMenuItem);
export default PlaybackRateMenuItem;

/**
 * @file chapters-track-menu-item.js
 */
import MenuItem from '../../menu/menu-item.js';
import Component from '../../component.js';
import * as Fn from '../../utils/fn.js';

/**
 * The chapter track menu item
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends MenuItem
 * @class ChaptersTrackMenuItem
 */
class ChaptersTrackMenuItem extends MenuItem {

  constructor(player, options){
    let track = options['track'];
    let cue = options['cue'];
    let currentTime = player.currentTime();

    // Modify options for parent MenuItem class's init.
    options['label'] = cue.text;
    options['selected'] = (cue['startTime'] <= currentTime && currentTime < cue['endTime']);
    super(player, options);

    this.track = track;
    this.cue = cue;
    track.addEventListener('cuechange', Fn.bind(this, this.update));
  }

  /**
   * Handle click on menu item
   *
   * @method handleClick
   */
  handleClick() {
    super.handleClick();
    this.player_.currentTime(this.cue.startTime);
    this.update(this.cue.startTime);
  }

  /**
   * Update chapter menu item
   *
   * @method update
   */
  update() {
    let cue = this.cue;
    let currentTime = this.player_.currentTime();

    // vjs.log(currentTime, cue.startTime);
    this.selected(cue['startTime'] <= currentTime && currentTime < cue['endTime']);
  }

}

Component.registerComponent('ChaptersTrackMenuItem', ChaptersTrackMenuItem);
export default ChaptersTrackMenuItem;

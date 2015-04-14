import MenuItem from '../../menu/menu-item.js';
import * as Lib from '../../lib.js';

/**
 * @constructor
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
    track.addEventListener('cuechange', Lib.bind(this, this.update));
  }

  onClick() {
    super.onClick();
    this.player_.currentTime(this.cue.startTime);
    this.update(this.cue.startTime);
  }

  update() {
    let cue = this.cue;
    let currentTime = this.player_.currentTime();

    // vjs.log(currentTime, cue.startTime);
    this.selected(cue['startTime'] <= currentTime && currentTime < cue['endTime']);
  }

}

MenuItem.registerComponent('ChaptersTrackMenuItem', ChaptersTrackMenuItem);
export default ChaptersTrackMenuItem;

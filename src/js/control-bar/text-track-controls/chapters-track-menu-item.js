/**
 * @file chapters-track-menu-item.js
 */
import MenuItem from '../../menu/menu-item.js';
import Component from '../../component.js';
import * as Fn from '../../utils/fn.js';

/**
 * The chapter track menu item
 *
 * @extends MenuItem
 */
class ChaptersTrackMenuItem extends MenuItem {

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
    const track = options.track;
    const cue = options.cue;
    const currentTime = player.currentTime();

    // Modify options for parent MenuItem class's init.
    options.selectable = true;
    options.label = cue.text;
    options.selected = (cue.startTime <= currentTime && currentTime < cue.endTime);
    super(player, options);

    this.track = track;
    this.cue = cue;
    track.addEventListener('cuechange', Fn.bind(this, this.update));
  }

  /**
   * This gets called when an `ChaptersTrackMenuItem` is "clicked". See
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
    super.handleClick();
    this.player_.currentTime(this.cue.startTime);
    this.update(this.cue.startTime);
  }

  /**
   * Update chapter menu item
   *
   * @param {EventTarget~Event} [event]
   *        The `cuechange` event that caused this function to run.
   *
   * @listens TextTrack#cuechange
   */
  update(event) {
    const cue = this.cue;
    const currentTime = this.player_.currentTime();

    // vjs.log(currentTime, cue.startTime);
    this.selected(cue.startTime <= currentTime && currentTime < cue.endTime);
  }

}

Component.registerComponent('ChaptersTrackMenuItem', ChaptersTrackMenuItem);
export default ChaptersTrackMenuItem;

/**
 * @file audio-track-menu-item.js
 */
import MenuItem from '../../menu/menu-item.js';
import Component from '../../component.js';
import {assign} from '../../utils/obj';

/**
 * An {@link AudioTrack} {@link MenuItem}
 *
 * @extends MenuItem
 */
class AudioTrackMenuItem extends MenuItem {

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
    const tracks = player.audioTracks();

    // Modify options for parent MenuItem class's init.
    options.label = track.label || track.language || 'Unknown';
    options.selected = track.enabled;

    super(player, options);

    this.track = track;

    this.addClass(`vjs-${track.kind}-menu-item`);

    const changeHandler = (...args) => {
      this.handleTracksChange.apply(this, args);
    };

    tracks.addEventListener('change', changeHandler);
    this.on('dispose', () => {
      tracks.removeEventListener('change', changeHandler);
    });
  }

  createEl(type, props, attrs) {
    let innerHTML = `<span class="vjs-menu-item-text">${this.localize(this.options_.label)}`;

    if (this.options_.track.kind === 'main-desc') {
      innerHTML += `
        <span aria-hidden="true" class="vjs-icon-placeholder"></span>
        <span class="vjs-control-text"> ${this.localize('Descriptions')}</span>
      `;
    }

    innerHTML += '</span>';

    const el = super.createEl(type, assign({
      innerHTML
    }, props), attrs);

    return el;
  }

  /**
   * This gets called when an `AudioTrackMenuItem is "clicked". See {@link ClickableComponent}
   * for more detailed information on what a click can be.
   *
   * @param {EventTarget~Event} [event]
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */
  handleClick(event) {
    const tracks = this.player_.audioTracks();

    super.handleClick(event);

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];

      track.enabled = track === this.track;
    }
  }

  /**
   * Handle any {@link AudioTrack} change.
   *
   * @param {EventTarget~Event} [event]
   *        The {@link AudioTrackList#change} event that caused this to run.
   *
   * @listens AudioTrackList#change
   */
  handleTracksChange(event) {
    this.selected(this.track.enabled);
  }
}

Component.registerComponent('AudioTrackMenuItem', AudioTrackMenuItem);
export default AudioTrackMenuItem;

/**
 * @file audio-track-menu-item.js
 */
import MenuItem from '../../menu/menu-item.js';
import Component from '../../component.js';
import * as Dom from '../../utils/dom.js';

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
    const el = super.createEl(type, props, attrs);
    const parentSpan = el.querySelector('.vjs-menu-item-text');

    if (this.options_.track.kind === 'main-desc') {
      parentSpan.appendChild(Dom.createEl('span', {
        className: 'vjs-icon-placeholder'
      }, {
        'aria-hidden': true
      }));
      parentSpan.appendChild(Dom.createEl('span', {
        className: 'vjs-control-text',
        textContent: ' ' + this.localize('Descriptions')
      }));
    }

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
    super.handleClick(event);

    // the audio track list will automatically toggle other tracks
    // off for us.
    this.track.enabled = true;

    // when native audio tracks are used, we want to make sure that other tracks are turned off
    if (this.player_.tech_.featuresNativeAudioTracks) {
      const tracks = this.player_.audioTracks();

      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];

        // skip the current track since we enabled it above
        if (track === this.track) {
          continue;
        }

        track.enabled = track === this.track;
      }
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

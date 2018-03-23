import {AudioTrackKind} from './track-enums';
import Track from './track';
import merge from '../utils/merge-options';

/**
 * A representation of a single `AudioTrack`. If it is part of an {@link AudioTrackList}
 * only one `AudioTrack` in the list will be enabled at a time.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#audiotrack}
 * @extends Track
 */
class AudioTrack extends Track {

  /**
   * Create an instance of this class.
   *
   * @param {Object} [options={}]
   *        Object of option names and values
   *
   * @param {AudioTrack~Kind} [options.kind='']
   *        A valid audio track kind
   *
   * @param {string} [options.id='vjs_track_' + Guid.newGUID()]
   *        A unique id for this AudioTrack.
   *
   * @param {string} [options.label='']
   *        The menu label for this track.
   *
   * @param {string} [options.language='']
   *        A valid two character language code.
   *
   * @param {boolean} [options.enabled]
   *        If this track is the one that is currently playing. If this track is part of
   *        an {@link AudioTrackList}, only one {@link AudioTrack} will be enabled.
   */
  constructor(options = {}) {
    const settings = merge(options, {
      kind: AudioTrackKind[options.kind] || ''
    });

    super(settings);

    let enabled = false;

    /**
     * @memberof AudioTrack
     * @member {boolean} enabled
     *         If this `AudioTrack` is enabled or not. When setting this will
     *         fire {@link AudioTrack#enabledchange} if the state of enabled is changed.
     * @instance
     *
     * @fires VideoTrack#selectedchange
     */
    Object.defineProperty(this, 'enabled', {
      get() {
        return enabled;
      },
      set(newEnabled) {
        // an invalid or unchanged value
        if (typeof newEnabled !== 'boolean' || newEnabled === enabled) {
          return;
        }
        enabled = newEnabled;

        /**
         * An event that fires when enabled changes on this track. This allows
         * the AudioTrackList that holds this track to act accordingly.
         *
         * > Note: This is not part of the spec! Native tracks will do
         *         this internally without an event.
         *
         * @event AudioTrack#enabledchange
         * @type {EventTarget~Event}
         */
        this.trigger('enabledchange');
      }
    });

    // if the user sets this track to selected then
    // set selected to that true value otherwise
    // we keep it false
    if (settings.enabled) {
      this.enabled = settings.enabled;
    }
    this.loaded_ = true;
  }
}

export default AudioTrack;

import {VideoTrackKind} from './track-enums';
import Track from './track';
import {merge} from '../utils/obj';

/**
 * A representation of a single `VideoTrack`.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#videotrack}
 * @extends Track
 */
class VideoTrack extends Track {

  /**
   * Create an instance of this class.
   *
   * @param {Object} [options={}]
   *        Object of option names and values
   *
   * @param {('alternative'|'captions'|'main'|'sign'|'subtitles'|'commentary')} [options.kind='']
   *        A valid {@link VideoTrack~Kind}
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
   * @param {boolean} [options.selected]
   *        If this track is the one that is currently playing.
   */
  constructor(options = {}) {
    const settings = merge(options, {
      kind: VideoTrackKind[options.kind] || ''
    });

    super(settings);

    let selected = false;

    /**
     * @memberof VideoTrack
     * @member {boolean} selected
     *         If this `VideoTrack` is selected or not. When setting this will
     *         fire {@link VideoTrack#selectedchange} if the state of selected changed.
     * @instance
     *
     * @fires VideoTrack#selectedchange
     */
    Object.defineProperty(this, 'selected', {
      get() {
        return selected;
      },
      set(newSelected) {
        // an invalid or unchanged value
        if (typeof newSelected !== 'boolean' || newSelected === selected) {
          return;
        }
        selected = newSelected;

        /**
         * An event that fires when selected changes on this track. This allows
         * the VideoTrackList that holds this track to act accordingly.
         *
         * > Note: This is not part of the spec! Native tracks will do
         *         this internally without an event.
         *
         * @event VideoTrack#selectedchange
         * @type {Event}
         */
        this.trigger('selectedchange');
      }
    });

    // if the user sets this track to selected then
    // set selected to that true value otherwise
    // we keep it false
    if (settings.selected) {
      this.selected = settings.selected;
    }
  }
}

export default VideoTrack;

/**
 * @file track.js
 */
import * as Guid from '../utils/guid.js';
import EventTarget from '../event-target';

/**
 * A Track class that contains all of the common functionality for {@link AudioTrack},
 * {@link VideoTrack}, and {@link TextTrack}.
 *
 * > Note: This class should not be used directly
 *
 * @see {@link https://html.spec.whatwg.org/multipage/embedded-content.html}
 * @extends EventTarget
 * @abstract
 */
class Track extends EventTarget {

  /**
   * Create an instance of this class.
   *
   * @param {Object} [options={}]
   *        Object of option names and values
   *
   * @param {string} [options.kind='']
   *        A valid kind for the track type you are creating.
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
   * @abstract
   */
  constructor(options = {}) {
    super();

    const trackProps = {
      id: options.id || 'vjs_track_' + Guid.newGUID(),
      kind: options.kind || '',
      language: options.language || ''
    };

    let label = options.label || '';

    /**
     * @memberof Track
     * @member {string} id
     *         The id of this track. Cannot be changed after creation.
     * @instance
     *
     * @readonly
     */

    /**
     * @memberof Track
     * @member {string} kind
     *         The kind of track that this is. Cannot be changed after creation.
     * @instance
     *
     * @readonly
     */

    /**
     * @memberof Track
     * @member {string} language
     *         The two letter language code for this track. Cannot be changed after
     *         creation.
     * @instance
     *
     * @readonly
     */

    for (const key in trackProps) {
      Object.defineProperty(this, key, {
        get() {
          return trackProps[key];
        },
        set() {}
      });
    }

    /**
     * @memberof Track
     * @member {string} label
     *         The label of this track. Cannot be changed after creation.
     * @instance
     *
     * @fires Track#labelchange
     */
    Object.defineProperty(this, 'label', {
      get() {
        return label;
      },
      set(newLabel) {
        if (newLabel !== label) {
          label = newLabel;

          /**
           * An event that fires when label changes on this track.
           *
           * > Note: This is not part of the spec!
           *
           * @event Track#labelchange
           * @type {EventTarget~Event}
           */
          this.trigger('labelchange');
        }
      }
    });
  }
}

export default Track;

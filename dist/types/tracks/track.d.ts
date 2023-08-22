export default Track;
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
declare class Track extends EventTarget {
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
    constructor(options?: {
        kind?: string;
        id?: string;
        label?: string;
        language?: string;
    });
}
import EventTarget from "../event-target";
//# sourceMappingURL=track.d.ts.map
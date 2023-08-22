export default VideoTrack;
/**
 * A representation of a single `VideoTrack`.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#videotrack}
 * @extends Track
 */
declare class VideoTrack extends Track {
    /**
     * Create an instance of this class.
     *
     * @param {Object} [options={}]
     *        Object of option names and values
     *
     * @param {string} [options.kind='']
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
    constructor(options?: {
        kind?: string;
        id?: string;
        label?: string;
        language?: string;
        selected?: boolean;
    });
    selected: any;
}
import Track from "./track";
//# sourceMappingURL=video-track.d.ts.map
export default AudioTrack;
/**
 * A representation of a single `AudioTrack`. If it is part of an {@link AudioTrackList}
 * only one `AudioTrack` in the list will be enabled at a time.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#audiotrack}
 * @extends Track
 */
declare class AudioTrack extends Track {
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
    constructor(options?: any);
    enabled: any;
    loaded_: boolean;
}
import Track from "./track";
//# sourceMappingURL=audio-track.d.ts.map
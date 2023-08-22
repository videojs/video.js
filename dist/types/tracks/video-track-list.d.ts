export default VideoTrackList;
/**
 * The current list of {@link VideoTrack} for a video.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#videotracklist}
 * @extends TrackList
 */
declare class VideoTrackList extends TrackList {
    /**
     * Create an instance of this class.
     *
     * @param {VideoTrack[]} [tracks=[]]
     *        A list of `VideoTrack` to instantiate the list with.
     */
    constructor(tracks?: VideoTrack[]);
    changing_: boolean;
    /**
     * Add a {@link VideoTrack} to the `VideoTrackList`.
     *
     * @param { import('./video-track').default } track
     *        The VideoTrack to add to the list
     *
     * @fires TrackList#addtrack
     */
    addTrack(track: import('./video-track').default): void;
    removeTrack(rtrack: any): void;
}
import TrackList from "./track-list";
//# sourceMappingURL=video-track-list.d.ts.map
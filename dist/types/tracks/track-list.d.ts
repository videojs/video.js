export default TrackList;
/**
 * Common functionaliy between {@link TextTrackList}, {@link AudioTrackList}, and
 * {@link VideoTrackList}
 *
 * @extends EventTarget
 */
declare class TrackList extends EventTarget {
    /**
     * Create an instance of this class
     *
     * @param { import('./track').default[] } tracks
     *        A list of tracks to initialize the list with.
     *
     * @abstract
     */
    constructor(tracks?: import('./track').default[]);
    tracks_: any[];
    /**
     * Add a {@link Track} to the `TrackList`
     *
     * @param { import('./track').default } track
     *        The audio, video, or text track to add to the list.
     *
     * @fires TrackList#addtrack
     */
    addTrack(track: import('./track').default): void;
    /**
     * Remove a {@link Track} from the `TrackList`
     *
     * @param { import('./track').default } rtrack
     *        The audio, video, or text track to remove from the list.
     *
     * @fires TrackList#removetrack
     */
    removeTrack(rtrack: import('./track').default): void;
    /**
     * Get a Track from the TrackList by a tracks id
     *
     * @param {string} id - the id of the track to get
     * @method getTrackById
     * @return { import('./track').default }
     * @private
     */
    private getTrackById;
    /**
     * Triggered when a different track is selected/enabled.
     *
     * @event TrackList#change
     * @type {Event}
     */
    /**
     * Events that can be called with on + eventName. See {@link EventHandler}.
     *
     * @property {Object} TrackList#allowedEvents_
     * @private
     */
    private allowedEvents_;
}
import EventTarget from "../event-target";
//# sourceMappingURL=track-list.d.ts.map
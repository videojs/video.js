export default HtmlTrackElementList;
/**
 * @file html-track-element-list.js
 */
/**
 * The current list of {@link HtmlTrackElement}s.
 */
declare class HtmlTrackElementList {
    /**
     * Create an instance of this class.
     *
     * @param {HtmlTrackElement[]} [tracks=[]]
     *        A list of `HtmlTrackElement` to instantiate the list with.
     */
    constructor(trackElements?: any[]);
    trackElements_: any[];
    /**
     * Add an {@link HtmlTrackElement} to the `HtmlTrackElementList`
     *
     * @param {HtmlTrackElement} trackElement
     *        The track element to add to the list.
     *
     * @private
     */
    private addTrackElement_;
    /**
     * Get an {@link HtmlTrackElement} from the `HtmlTrackElementList` given an
     * {@link TextTrack}.
     *
     * @param {TextTrack} track
     *        The track associated with a track element.
     *
     * @return {HtmlTrackElement|undefined}
     *         The track element that was found or undefined.
     *
     * @private
     */
    private getTrackElementByTrack_;
    /**
     * Remove a {@link HtmlTrackElement} from the `HtmlTrackElementList`
     *
     * @param {HtmlTrackElement} trackElement
     *        The track element to remove from the list.
     *
     * @private
     */
    private removeTrackElement_;
}
//# sourceMappingURL=html-track-element-list.d.ts.map
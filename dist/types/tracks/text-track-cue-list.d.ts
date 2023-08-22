export default TextTrackCueList;
/**
 * ~TextTrackCue
 */
export type TextTrackCueList = {
    /**
     *           The unique id for this text track cue
     */
    id: string;
    /**
     *           The start time for this text track cue
     */
    startTime: number;
    /**
     *           The end time for this text track cue
     */
    endTime: number;
    /**
     *           Pause when the end time is reached if true.
     */
    pauseOnExit: boolean;
};
/**
 * @file text-track-cue-list.js
 */
/**
 * @typedef {Object} TextTrackCueList~TextTrackCue
 *
 * @property {string} id
 *           The unique id for this text track cue
 *
 * @property {number} startTime
 *           The start time for this text track cue
 *
 * @property {number} endTime
 *           The end time for this text track cue
 *
 * @property {boolean} pauseOnExit
 *           Pause when the end time is reached if true.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#texttrackcue}
 */
/**
 * A List of TextTrackCues.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#texttrackcuelist}
 */
declare class TextTrackCueList {
    /**
     * Create an instance of this class..
     *
     * @param {Array} cues
     *        A list of cues to be initialized with
     */
    constructor(cues: any[]);
    /**
     * A setter for cues in this list. Creates getters
     * an an index for the cues.
     *
     * @param {Array} cues
     *        An array of cues to set
     *
     * @private
     */
    private setCues_;
    cues_: any[];
    length_: number;
    /**
     * Get a `TextTrackCue` that is currently in the `TextTrackCueList` by id.
     *
     * @param {string} id
     *        The id of the cue that should be searched for.
     *
     * @return {TextTrackCueList~TextTrackCue|null}
     *         A single cue or null if none was found.
     */
    getCueById(id: string): TextTrackCueList;
}
//# sourceMappingURL=text-track-cue-list.d.ts.map
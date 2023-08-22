export default TextTrack;
/**
 * A representation of a single `TextTrack`.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#texttrack}
 * @extends Track
 */
declare class TextTrack extends Track {
    /**
     * Create an instance of this class.
     *
     * @param {Object} options={}
     *        Object of option names and values
     *
     * @param { import('../tech/tech').default } options.tech
     *        A reference to the tech that owns this TextTrack.
     *
     * @param {TextTrack~Kind} [options.kind='subtitles']
     *        A valid text track kind.
     *
     * @param {TextTrack~Mode} [options.mode='disabled']
     *        A valid text track mode.
     *
     * @param {string} [options.id='vjs_track_' + Guid.newGUID()]
     *        A unique id for this TextTrack.
     *
     * @param {string} [options.label='']
     *        The menu label for this track.
     *
     * @param {string} [options.language='']
     *        A valid two character language code.
     *
     * @param {string} [options.srclang='']
     *        A valid two character language code. An alternative, but deprioritized
     *        version of `options.language`
     *
     * @param {string} [options.src]
     *        A url to TextTrack cues.
     *
     * @param {boolean} [options.default]
     *        If this track should default to on or off.
     */
    constructor(options?: {
        tech: import('../tech/tech').default;
    });
    tech_: any;
    cues_: any[];
    activeCues_: any[];
    preload_: boolean;
    timeupdateHandler: Function;
    src: any;
    loaded_: boolean;
    startTracking(): void;
    rvf_: any;
    stopTracking(): void;
    /**
     * Add a cue to the internal list of cues.
     *
     * @param {TextTrack~Cue} cue
     *        The cue to add to our internal list
     */
    addCue(originalCue: any): void;
    /**
     * Remove a cue from our internal list
     *
     * @param {TextTrack~Cue} removeCue
     *        The cue to remove from our internal list
     */
    removeCue(removeCue: any): void;
    /**
     * cuechange - One or more cues in the track have become active or stopped being active.
     */
    allowedEvents_: {
        cuechange: string;
    };
}
import Track from "./track.js";
//# sourceMappingURL=text-track.d.ts.map
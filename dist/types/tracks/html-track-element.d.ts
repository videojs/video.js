export default HTMLTrackElement;
/**
 * A single track represented in the DOM.
 *
 * @see [Spec]{@link https://html.spec.whatwg.org/multipage/embedded-content.html#htmltrackelement}
 * @extends EventTarget
 */
declare class HTMLTrackElement extends EventTarget {
    /**
     * Create an instance of this class.
     *
     * @param {Object} options={}
     *        Object of option names and values
     *
     * @param { import('../tech/tech').default } options.tech
     *        A reference to the tech that owns this HTMLTrackElement.
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
    kind: any;
    src: any;
    srclang: any;
    label: any;
    default: any;
    allowedEvents_: {
        load: string;
    };
}
declare namespace HTMLTrackElement {
    const NONE: number;
    const LOADING: number;
    const LOADED: number;
    const ERROR: number;
}
import EventTarget from "../event-target";
//# sourceMappingURL=html-track-element.d.ts.map
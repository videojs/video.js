/**
 * All possible `VideoTrackKind`s
 */
export type VideoTrackKind = any;
export namespace VideoTrackKind {
    const alternative: string;
    const captions: string;
    const main: string;
    const sign: string;
    const subtitles: string;
    const commentary: string;
}
/**
 * All possible `AudioTrackKind`s
 */
export type AudioTrackKind = any;
/**
 * All possible `AudioTrackKind`s
 *
 * @see https://html.spec.whatwg.org/multipage/embedded-content.html#dom-audiotrack-kind
 * @typedef AudioTrack~Kind
 * @enum
 */
export const AudioTrackKind: {
    alternative: string;
    descriptions: string;
    main: string;
    'main-desc': string;
    translation: string;
    commentary: string;
};
/**
 * All possible `TextTrackKind`s
 */
export type TextTrackKind = any;
export namespace TextTrackKind {
    const subtitles_1: string;
    export { subtitles_1 as subtitles };
    const captions_1: string;
    export { captions_1 as captions };
    export const descriptions: string;
    export const chapters: string;
    export const metadata: string;
}
/**
 * All possible `TextTrackMode`s
 */
export type TextTrackMode = any;
export namespace TextTrackMode {
    const disabled: string;
    const hidden: string;
    const showing: string;
}
/**
 * ~Kind
 */
export type VideoTrack = any;
/**
 * ~Kind
 */
export type AudioTrack = any;
/**
 * ~Kind
 */
export type TextTrack = any;
//# sourceMappingURL=track-enums.d.ts.map
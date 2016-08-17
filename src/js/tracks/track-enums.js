/**
 * @file track-kinds.js
 */

/**
 * https://html.spec.whatwg.org/multipage/embedded-content.html#dom-videotrack-kind
 *
 * enum VideoTrackKind {
 *   "alternative",
 *   "captions",
 *   "main",
 *   "sign",
 *   "subtitles",
 *   "commentary",
 *   "",
 * };
 */
export const VideoTrackKind = {
  alternative: 'alternative',
  captions: 'captions',
  main: 'main',
  sign: 'sign',
  subtitles: 'subtitles',
  commentary: 'commentary'
};

/**
 * https://html.spec.whatwg.org/multipage/embedded-content.html#dom-audiotrack-kind
 *
 * enum AudioTrackKind {
 *   "alternative",
 *   "descriptions",
 *   "main",
 *   "main-desc",
 *   "translation",
 *   "commentary",
 *   "",
 * };
 */
export const AudioTrackKind = {
  'alternative': 'alternative',
  'descriptions': 'descriptions',
  'main': 'main',
  'main-desc': 'main-desc',
  'translation': 'translation',
  'commentary': 'commentary'
};

/**
 * https://html.spec.whatwg.org/multipage/embedded-content.html#texttrackkind
 *
 * enum TextTrackKind {
 *   "subtitles",
 *   "captions",
 *   "descriptions",
 *   "chapters",
 *   "metadata"
 * };
 */
export const TextTrackKind = {
  subtitles: 'subtitles',
  captions: 'captions',
  descriptions: 'descriptions',
  chapters: 'chapters',
  metadata: 'metadata'
};

/**
 * https://html.spec.whatwg.org/multipage/embedded-content.html#texttrackmode
 *
 * enum TextTrackMode { "disabled",  "hidden",  "showing" };
 */
export const TextTrackMode = {
  disabled: 'disabled',
  hidden: 'hidden',
  showing: 'showing'
};

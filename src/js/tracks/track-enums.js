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
const VideoTrackKind = {
  alternative: 'alternative',
  captions: 'captions',
  main: 'main',
  sign: 'sign',
  subtitles: 'subtitles',
  commentary: 'commentary',
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
const AudioTrackKind = {
  alternative: 'alternative',
  descriptions: 'descriptions',
  main: 'main',
  'main-desc': 'main-desc',
  translation: 'translation',
  commentary: 'commentary',
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
const TextTrackKind = {
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
const TextTrackMode = {
  disabled: 'disabled',
  hidden: 'hidden',
  showing: 'showing'
};

/* jshint ignore:start */
// we ignore jshint here because it does not see
// AudioTrackKind as defined here
export default { VideoTrackKind, AudioTrackKind, TextTrackKind, TextTrackMode };
/* jshint ignore:end */


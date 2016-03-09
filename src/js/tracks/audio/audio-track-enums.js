/**
 * @file audio-track-enums.js
 */

/**
 * https://html.spec.whatwg.org/multipage/embedded-content.html#dom-audiotrack-kind
 *
 * enum AudioTrackKind {
 *   "alternative",
 *   "descriptions",
 *   "main",
 *   "translation",
 *   "commentary"
 * };
 */
const AudioTrackKind = {
  alternative: 'alternative',
  descriptions: 'descriptions',
  main: 'main',
  translation: 'translation',
  commentary: 'commentary'
};

/* jshint ignore:start */
// we ignore jshint here because it does not see
// TextTrackKind as defined here somehow...
export { AudioTrackKind };
/* jshint ignore:end */

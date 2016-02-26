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

/* jshint ignore:start */
// we ignore jshint here because it does not see
// AudioTrackKind as defined here
export { AudioTrackKind };
/* jshint ignore:end */

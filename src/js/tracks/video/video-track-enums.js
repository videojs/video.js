/**
 * @file video-track-enums.js
 */

/**
 * https://html.spec.whatwg.org/multipage/embedded-content.html#dom-videotrack-kind
 *
 * enum VideoTrackKind {
 *   "alternative",
 *   "descriptions",
 *   "main",
 *   "translation",
 *   "commentary"
 * };
 */
const VideoTrackKind = {
  alternative: 'alternative',
  main: 'main',
  sign: 'sign',
  commentary: 'commentary'
};

/* jshint ignore:start */
// we ignore jshint here because it does not see
// VideoTrackKind as defined here somehow...
export { VideoTrackKind };
/* jshint ignore:end */

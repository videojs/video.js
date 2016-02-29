/**
 * @file text-track-enums.js
 */

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

/* jshint ignore:start */
// we ignore jshint here because it does not see
// TextTrackMode or TextTrackKind as defined here somehow...
export { TextTrackMode, TextTrackKind };
/* jshint ignore:end */

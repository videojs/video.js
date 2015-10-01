/**
 * @file text-track-enums.js
 *
 * https://html.spec.whatwg.org/multipage/embedded-content.html#texttrackmode
 *
 * enum TextTrackMode { "disabled",  "hidden",  "showing" };
 */
var TextTrackMode = {
  'disabled': 'disabled',
  'hidden': 'hidden',
  'showing': 'showing'
};

/*
 * https://html.spec.whatwg.org/multipage/embedded-content.html#texttrackkind
 *
 * enum TextTrackKind { "subtitles",  "captions",  "descriptions",  "chapters",  "metadata" };
 */
var TextTrackKind = {
  'subtitles': 'subtitles',
  'captions': 'captions',
  'descriptions': 'descriptions',
  'chapters': 'chapters',
  'metadata': 'metadata'
};

export { TextTrackMode, TextTrackKind };

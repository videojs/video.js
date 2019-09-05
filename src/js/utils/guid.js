/**
 * @file guid.js
 * @module guid
 */

// Default value for GUIDs. This allows us to reset the GUID counter in tests.
//
// The initial GUID is 3 because some users have come to rely on the first
// default player ID ending up as `vjs_video_3`.
//
// See: https://github.com/videojs/video.js/pull/6216
const _initialGuid = 3;

/**
 * Unique ID for an element or function
 *
 * @type {Number}
 */
let _guid = _initialGuid;

/**
 * Get a unique auto-incrementing ID by number that has not been returned before.
 *
 * @return {number}
 *         A new unique ID.
 */
export function newGUID() {
  return _guid++;
}

/**
 * Reset the unique auto-incrementing ID for testing only.
 */
export function resetGuidInTestsOnly() {
  _guid = _initialGuid;
}

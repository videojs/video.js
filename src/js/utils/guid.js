/**
 * @file guid.js
 * @module guid
 */

// Default value for GUIDs. This allows us to reset the GUID counter in tests.
const _guidStart = 2;

/**
 * Unique ID for an element or function
 * @type {Number}
 */
let _guid = _guidStart;

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
 * Reset the unique auto-incrementing ID.
 *
 * FOR TESTS ONLY!
 */
export function resetGuidInTestsOnly() {
  _guid = _guidStart;
}

/**
 * @file guid.js
 * @module guid
 */

/**
 * Unique ID for an element or function
 * @type {Number}
 */
let _guid = 1;

/**
 * Get the next unique ID by incrementing the global _guid singleton.
 *
 * @return {number}
 *         A new unique ID.
 */
export function newGUID() {
  return _guid++;
}

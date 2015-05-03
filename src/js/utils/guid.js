/**
 * Unique ID for an element or function
 * @type {Number}
 * @private
 */
let _guid = 1;

/**
 * Get the next unique ID
 */
export function newGUID() {
  return _guid++;
}

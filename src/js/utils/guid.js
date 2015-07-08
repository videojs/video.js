/**
 * @file guid.js
 *
 * Unique ID for an element or function
 * @type {Number}
 * @private
 */
let _guid = 1;

/**
 * Get the next unique ID
 *
 * @return {String} 
 * @function newGUID
 */
export function newGUID() {
  return _guid++;
}

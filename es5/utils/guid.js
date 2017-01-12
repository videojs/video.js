"use strict";

exports.__esModule = true;
exports.newGUID = newGUID;
/**
 * @file guid.js
 * @module guid
 */

/**
 * Unique ID for an element or function
 * @type {Number}
 */
var _guid = 1;

/**
 * Get a unique auto-incrementing ID by number that has not been returned before.
 *
 * @return {number}
 *         A new unique ID.
 */
function newGUID() {
  return _guid++;
}

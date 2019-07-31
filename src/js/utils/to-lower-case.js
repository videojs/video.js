/**
 * @file to-lower-case.js
 * @module to-lower-case
 */

/**
 * Lowercase the first letter of a string.
 *
 * @param {string} string
 *        String to be uppercased
 *
 * @return {string}
 *         The string with an uppercased first letter
 */
function toLowerCase(string) {
  if (typeof string !== 'string') {
    return string;
  }

  return string.replace(/./, (w) => w.toLowerCase());
}

export default toLowerCase;

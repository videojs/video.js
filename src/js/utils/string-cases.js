/**
 * @file string-cases.js
 * @module to-lower-case
 */

/**
 * Lowercase the first letter of a string.
 *
 * @param {string} string
 *        String to be lowercased
 *
 * @return {string}
 *         The string with a lowercased first letter
 */
export const toLowerCase = function(string) {
  if (typeof string !== 'string') {
    return string;
  }

  return string.replace(/./, (w) => w.toLowerCase());
};

/**
 * Uppercase the first letter of a string.
 *
 * @param {string} string
 *        String to be uppercased
 *
 * @return {string}
 *         The string with an uppercased first letter
 */
export const toTitleCase = function(string) {
  if (typeof string !== 'string') {
    return string;
  }

  return string.replace(/./, (w) => w.toUpperCase());
};

/**
 * Compares the TitleCase versions of the two strings for equality.
 *
 * @param {string} str1
 *        The first string to compare
 *
 * @param {string} str2
 *        The second string to compare
 *
 * @return {boolean}
 *         Whether the TitleCase versions of the strings are equal
 */
export const titleCaseEquals = function(str1, str2) {
  return toTitleCase(str1) === toTitleCase(str2);
};

/**
 * Keep a number between a min and a max value
 *
 * @param {number} number
 *        The number to clamp
 *
 * @param {number} min
 *        The minimum value
 * @param {number} max
 *        The maximum value
 *
 * @return {number}
 *         the clamped number
 */
const clamp = function(number, min, max) {
  number = Number(number);

  return Math.min(max, Math.max(min, isNaN(number) ? min : number));
};

export default clamp;

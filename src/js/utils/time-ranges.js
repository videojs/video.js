/**
 * @file time-ranges.js
 * @module time-ranges
 */
import window from 'global/window';

/**
 * Returns the time for the specified index at the start or end
 * of a TimeRange object.
 *
 * @typedef    {Function} TimeRangeIndex
 *
 * @param      {number} [index=0]
 *             The range number to return the time for.
 *
 * @return     {number}
 *             The time offset at the specified index.
 *
 * @deprecated The index argument must be provided.
 *             In the future, leaving it out will throw an error.
 */

/**
 * An object that contains ranges of time.
 *
 * @typedef  {Object} TimeRange
 *
 * @property {number} length
 *           The number of time ranges represented by this object.
 *
 * @property {module:time-ranges~TimeRangeIndex} start
 *           Returns the time offset at which a specified time range begins.
 *
 * @property {module:time-ranges~TimeRangeIndex} end
 *           Returns the time offset at which a specified time range ends.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/TimeRanges
 */

/**
 * Check if any of the time ranges are over the maximum index.
 *
 * @private
 * @param   {string} fnName
 *          The function name to use for logging
 *
 * @param   {number} index
 *          The index to check
 *
 * @param   {number} maxIndex
 *          The maximum possible index
 *
 * @throws  {Error} if the timeRanges provided are over the maxIndex
 */
function rangeCheck(fnName, index, maxIndex) {
  if (typeof index !== 'number' || index < 0 || index > maxIndex) {
    throw new Error(`Failed to execute '${fnName}' on 'TimeRanges': The index provided (${index}) is non-numeric or out of bounds (0-${maxIndex}).`);
  }
}

/**
 * Get the time for the specified index at the start or end
 * of a TimeRange object.
 *
 * @private
 * @param      {string} fnName
 *             The function name to use for logging
 *
 * @param      {string} valueIndex
 *             The property that should be used to get the time. should be
 *             'start' or 'end'
 *
 * @param      {Array} ranges
 *             An array of time ranges
 *
 * @param      {Array} [rangeIndex=0]
 *             The index to start the search at
 *
 * @return     {number}
 *             The time that offset at the specified index.
 *
 * @deprecated rangeIndex must be set to a value, in the future this will throw an error.
 * @throws     {Error} if rangeIndex is more than the length of ranges
 */
function getRange(fnName, valueIndex, ranges, rangeIndex) {
  rangeCheck(fnName, rangeIndex, ranges.length - 1);
  return ranges[rangeIndex][valueIndex];
}

/**
 * Create a time range object given ranges of time.
 *
 * @private
 * @param   {Array} [ranges]
 *          An array of time ranges.
 */
function createTimeRangesObj(ranges) {
  let timeRangesObj;

  if (ranges === undefined || ranges.length === 0) {
    timeRangesObj = {
      length: 0,
      start() {
        throw new Error('This TimeRanges object is empty');
      },
      end() {
        throw new Error('This TimeRanges object is empty');
      }
    };
  } else {
    timeRangesObj = {
      length: ranges.length,
      start: getRange.bind(null, 'start', 0, ranges),
      end: getRange.bind(null, 'end', 1, ranges)
    };
  }

  if (window.Symbol && window.Symbol.iterator) {
    timeRangesObj[window.Symbol.iterator] = () => (ranges || []).values();
  }

  return timeRangesObj;
}

/**
 * Create a `TimeRange` object which mimics an
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/TimeRanges|HTML5 TimeRanges instance}.
 *
 * @param {number|Array[]} start
 *        The start of a single range (a number) or an array of ranges (an
 *        array of arrays of two numbers each).
 *
 * @param {number} end
 *        The end of a single range. Cannot be used with the array form of
 *        the `start` argument.
 */
export function createTimeRanges(start, end) {
  if (Array.isArray(start)) {
    return createTimeRangesObj(start);
  } else if (start === undefined || end === undefined) {
    return createTimeRangesObj();
  }
  return createTimeRangesObj([[start, end]]);
}

export { createTimeRanges as createTimeRange };

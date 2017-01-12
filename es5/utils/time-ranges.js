'use strict';

exports.__esModule = true;
exports.createTimeRange = undefined;
exports.createTimeRanges = createTimeRanges;

var _log = require('./log.js');

var _log2 = _interopRequireDefault(_log);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/**
 * Returns the time for the specified index at the start or end
 * of a TimeRange object.
 *
 * @function time-ranges:indexFunction
 *
 * @param {number} [index=0]
 *        The range number to return the time for.
 *
 * @return {number}
 *         The time that offset at the specified index.
 *
 * @depricated index must be set to a value, in the future this will throw an error.
 */

/**
 * An object that contains ranges of time for various reasons.
 *
 * @typedef {Object} TimeRange
 *
 * @property {number} length
 *           The number of time ranges represented by this Object
 *
 * @property {time-ranges:indexFunction} start
 *           Returns the time offset at which a specified time range begins.
 *
 * @property {time-ranges:indexFunction} end
 *           Returns the time offset at which a specified time range begins.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/TimeRanges
 */

/**
 * Check if any of the time ranges are over the maximum index.
 *
 * @param {string} fnName
 *        The function name to use for logging
 *
 * @param {number} index
 *        The index to check
 *
 * @param {number} maxIndex
 *        The maximum possible index
 *
 * @throws {Error} if the timeRanges provided are over the maxIndex
 */
function rangeCheck(fnName, index, maxIndex) {
  if (index < 0 || index > maxIndex) {
    throw new Error('Failed to execute \'' + fnName + '\' on \'TimeRanges\': The index provided (' + index + ') is greater than or equal to the maximum bound (' + maxIndex + ').');
  }
}

/**
 * Check if any of the time ranges are over the maximum index.
 *
 * @param {string} fnName
 *        The function name to use for logging
 *
 * @param {string} valueIndex
 *        The proprety that should be used to get the time. should be 'start' or 'end'
 *
 * @param {Array} ranges
 *        An array of time ranges
 *
 * @param {Array} [rangeIndex=0]
 *        The index to start the search at
 *
 * @return {number}
 *         The time that offset at the specified index.
 *
 *
 * @depricated rangeIndex must be set to a value, in the future this will throw an error.
 * @throws {Error} if rangeIndex is more than the length of ranges
 */
/**
 * @file time-ranges.js
 * @module time-ranges
 */
function getRange(fnName, valueIndex, ranges, rangeIndex) {
  if (rangeIndex === undefined) {
    _log2['default'].warn('DEPRECATED: Function \'' + fnName + '\' on \'TimeRanges\' called without an index argument.');
    rangeIndex = 0;
  }
  rangeCheck(fnName, rangeIndex, ranges.length - 1);
  return ranges[rangeIndex][valueIndex];
}

/**
 * Create a time range object givent ranges of time.
 *
 * @param {Array} [ranges]
 *        An array of time ranges.
 */
function createTimeRangesObj(ranges) {
  if (ranges === undefined || ranges.length === 0) {
    return {
      length: 0,
      start: function start() {
        throw new Error('This TimeRanges object is empty');
      },
      end: function end() {
        throw new Error('This TimeRanges object is empty');
      }
    };
  }
  return {
    length: ranges.length,
    start: getRange.bind(null, 'start', 0, ranges),
    end: getRange.bind(null, 'end', 1, ranges)
  };
}

/**
 * Should create a fake `TimeRange` object which mimics an HTML5 time range instance.
 *
 * @param {number|Array} start
 *        The start of a single range or an array of ranges
 *
 * @param {number} end
 *        The end of a single range.
 *
 * @private
 */
function createTimeRanges(start, end) {
  if (Array.isArray(start)) {
    return createTimeRangesObj(start);
  } else if (start === undefined || end === undefined) {
    return createTimeRangesObj();
  }
  return createTimeRangesObj([[start, end]]);
}

exports.createTimeRange = createTimeRanges;

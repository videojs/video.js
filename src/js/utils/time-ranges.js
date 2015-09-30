import log from './log.js';

/**
 * @file time-ranges.js
 *
 * Should create a fake TimeRange object
 * Mimics an HTML5 time range instance, which has functions that
 * return the start and end times for a range
 * TimeRanges are returned by the buffered() method
 *
 * @param  {(Number|Array)} Start of a single range or an array of ranges
 * @param  {Number} End of a single range
 * @private
 * @method createTimeRanges
 */
export function createTimeRanges(start, end){
  if (Array.isArray(start)) {
    return createTimeRangesObj(start);
  } else if (start === undefined || end === undefined) {
    return createTimeRangesObj();
  }
  return createTimeRangesObj([[start, end]]);
}

export { createTimeRanges as createTimeRange };

function createTimeRangesObj(ranges){
  if (ranges === undefined || ranges.length === 0) {
    return {
      length: 0,
      start: function() {
        throw new Error('This TimeRanges object is empty');
      },
      end: function() {
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

function getRange(fnName, valueIndex, ranges, rangeIndex){
  if (rangeIndex === undefined) {
    log.warn(`DEPRECATED: Function '${fnName}' on 'TimeRanges' called without an index argument.`);
    rangeIndex = 0;
  }
  rangeCheck(fnName, rangeIndex, ranges.length - 1);
  return ranges[rangeIndex][valueIndex];
}

function rangeCheck(fnName, index, maxIndex){
  if (index < 0 || index > maxIndex) {
    throw new Error(`Failed to execute '${fnName}' on 'TimeRanges': The index provided (${index}) is greater than or equal to the maximum bound (${maxIndex}).`);
  }
}

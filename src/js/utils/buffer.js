/**
 * @file buffer.js
 */
import { createTimeRange } from './time-ranges.js';

/**
 * Compute how much your video has been buffered
 *
 * @param  {Object} Buffered object
 * @param  {Number} Total duration
 * @return {Number} Percent buffered of the total duration
 * @private
 * @function bufferedPercent
 */
export function bufferedPercent(buffered, duration) {
  var bufferedDuration = 0,
      start, end;

  if (!duration) {
    return 0;
  }

  if (!buffered || !buffered.length) {
    buffered = createTimeRange(0, 0);
  }

  for (let i = 0; i < buffered.length; i++){
    start = buffered.start(i);
    end   = buffered.end(i);

    // buffered end can be bigger than duration by a very small fraction
    if (end > duration) {
      end = duration;
    }

    bufferedDuration += end - start;
  }

  return bufferedDuration / duration;
}

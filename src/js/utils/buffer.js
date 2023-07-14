/**
 * @file buffer.js
 * @module buffer
 */
import { createTimeRange } from './time.js';

/**
 * Compute the percentage of the media that has been buffered.
 *
 * @param { import('./time').TimeRange } buffered
 *        The current `TimeRanges` object representing buffered time ranges
 *
 * @param {number} duration
 *        Total duration of the media
 *
 * @return {number}
 *         Percent buffered of the total duration in decimal form.
 */
export function bufferedPercent(buffered, duration) {
  let bufferedDuration = 0;

  if (!duration) {
    return 0;
  }

  if (!buffered || !buffered.length) {
    buffered = createTimeRange(0, 0);
  }

  for (let i = 0; i < buffered.length; i++) {
    const start = buffered.start(i);
    const end = buffered.end(i);

    // buffered end can be bigger than duration by a very small fraction
    end = Math.min(end, duration);

    bufferedDuration += end - start;
  }

  return bufferedDuration / duration;
}

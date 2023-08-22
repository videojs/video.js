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
 *
 * @return {TimeRange}
 */
export function createTimeRanges(start: number | any[][], end: number): TimeRange;
/**
 * Replaces the default formatTime implementation with a custom implementation.
 *
 * @param {Function} customImplementation
 *        A function which will be used in place of the default formatTime
 *        implementation. Will receive the current time in seconds and the
 *        guide (in seconds) as arguments.
 */
export function setFormatTime(customImplementation: Function): void;
/**
 * Resets formatTime to the default implementation.
 */
export function resetFormatTime(): void;
/**
 * Delegates to either the default time formatting function or a custom
 * function supplied via `setFormatTime`.
 *
 * Formats seconds as a time string (H:MM:SS or M:SS). Supplying a
 * guide (in seconds) will force a number of leading zeros to cover the
 * length of the guide.
 *
 * @example  formatTime(125, 600) === "02:05"
 * @param    {number} seconds
 *           Number of seconds to be turned into a string
 *
 * @param    {number} guide
 *           Number (in seconds) to model the string after
 *
 * @return   {string}
 *           Time formatted as H:MM:SS or M:SS
 */
export function formatTime(seconds: number, guide?: number): string;
export { createTimeRanges as createTimeRange };
/**
 * Returns the time for the specified index at the start or end
 * of a TimeRange object.
 */
export type TimeRangeIndex = Function;
/**
 * An object that contains ranges of time, which mimics {@link TimeRanges }.
 */
export type TimeRange = {
    /**
     *           The number of time ranges represented by this object.
     */
    length: number;
    /**
     *           Returns the time offset at which a specified time range begins.
     */
    start: any;
    /**
     *           Returns the time offset at which a specified time range ends.
     */
    end: any;
};
//# sourceMappingURL=time.d.ts.map
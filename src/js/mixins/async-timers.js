/**
 * @file mixins/evented.js
 * @module evented
 */
import window from 'global/window';
import {isEvented, default as evented} from './evented.js';
import * as Obj from '../utils/obj';
import * as Fn from '../utils/fn.js';
import Map from '../utils/map.js';
import Set from '../utils/set.js';

/**
 * Contains methods that provide async timer capabilities to an object which is passed
 * to {@link module:async-timers|async}.
 *
 * @mixin AsyncTimers
 */
export const AsyncTimersMixin = {
  /**
   * A callback that has no parameters and is bound into `Component`s context.
   *
   * @callback Component~GenericCallback
   * @this Component
   */

  /**
   * Creates a function that runs after an `x` millisecond timeout. This function is a
   * wrapper around `window.setTimeout`. There are a few reasons to use this one
   * instead though:
   * 1. It gets cleared via  {@link Component#clearTimeout} when
   *    {@link Component#dispose} gets called.
   * 2. The function callback will gets turned into a {@link Component~GenericCallback}
   *
   * > Note: You can't use `window.clearTimeout` on the id returned by this function. This
   *         will cause its dispose listener not to get cleaned up! Please use
   *         {@link Component#clearTimeout} or {@link Component#dispose} instead.
   *
   * @param {Component~GenericCallback} fn
   *        The function that will be run after `timeout`.
   *
   * @param {number} timeout
   *        Timeout in milliseconds to delay before executing the specified function.
   *
   * @return {number}
   *         Returns a timeout ID that gets used to identify the timeout. It can also
   *         get used in {@link Component#clearTimeout} to clear the timeout that
   *         was set.
   *
   * @listens Component#dispose
   * @see [Similar to]{@link https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setTimeout}
   */
  setTimeout(fn, timeout) {
    // declare as variables so they are properly available in timeout function
    // eslint-disable-next-line
    var timeoutId, disposeFn;

    fn = Fn.bind(this, fn);

    this.clearTimersOnDispose_();

    timeoutId = window.setTimeout(() => {
      if (this.setTimeoutIds_.has(timeoutId)) {
        this.setTimeoutIds_.delete(timeoutId);
      }
      fn();
    }, timeout);

    this.setTimeoutIds_.add(timeoutId);

    return timeoutId;
  },

  /**
   * Clears a timeout that gets created via `window.setTimeout` or
   * {@link Component#setTimeout}. If you set a timeout via {@link Component#setTimeout}
   * use this function instead of `window.clearTimout`. If you don't your dispose
   * listener will not get cleaned up until {@link Component#dispose}!
   *
   * @param {number} timeoutId
   *        The id of the timeout to clear. The return value of
   *        {@link Component#setTimeout} or `window.setTimeout`.
   *
   * @return {number}
   *         Returns the timeout id that was cleared.
   *
   * @see [Similar to]{@link https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/clearTimeout}
   */
  clearTimeout(timeoutId) {
    if (this.setTimeoutIds_.has(timeoutId)) {
      this.setTimeoutIds_.delete(timeoutId);
      window.clearTimeout(timeoutId);
    }

    return timeoutId;
  },

  /**
   * Creates a function that gets run every `x` milliseconds. This function is a wrapper
   * around `window.setInterval`. There are a few reasons to use this one instead though.
   * 1. It gets cleared via  {@link Component#clearInterval} when
   *    {@link Component#dispose} gets called.
   * 2. The function callback will be a {@link Component~GenericCallback}
   *
   * @param {Component~GenericCallback} fn
   *        The function to run every `x` seconds.
   *
   * @param {number} interval
   *        Execute the specified function every `x` milliseconds.
   *
   * @return {number}
   *         Returns an id that can be used to identify the interval. It can also be be used in
   *         {@link Component#clearInterval} to clear the interval.
   *
   * @listens Component#dispose
   * @see [Similar to]{@link https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setInterval}
   */
  setInterval(fn, interval) {
    fn = Fn.bind(this, fn);

    this.clearTimersOnDispose_();

    const intervalId = window.setInterval(fn, interval);

    this.setIntervalIds_.add(intervalId);

    return intervalId;
  },

  /**
   * Clears an interval that gets created via `window.setInterval` or
   * {@link Component#setInterval}. If you set an inteval via {@link Component#setInterval}
   * use this function instead of `window.clearInterval`. If you don't your dispose
   * listener will not get cleaned up until {@link Component#dispose}!
   *
   * @param {number} intervalId
   *        The id of the interval to clear. The return value of
   *        {@link Component#setInterval} or `window.setInterval`.
   *
   * @return {number}
   *         Returns the interval id that was cleared.
   *
   * @see [Similar to]{@link https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/clearInterval}
   */
  clearInterval(intervalId) {
    if (this.setIntervalIds_.has(intervalId)) {
      this.setIntervalIds_.delete(intervalId);
      window.clearInterval(intervalId);
    }

    return intervalId;
  },

  /**
   * Queues up a callback to be passed to requestAnimationFrame (rAF), but
   * with a few extra bonuses:
   *
   * - Supports browsers that do not support rAF by falling back to
   *   {@link Component#setTimeout}.
   *
   * - The callback is turned into a {@link Component~GenericCallback} (i.e.
   *   bound to the component).
   *
   * - Automatic cancellation of the rAF callback is handled if the component
   *   is disposed before it is called.
   *
   * @param  {Component~GenericCallback} fn
   *         A function that will be bound to this component and executed just
   *         before the browser's next repaint.
   *
   * @return {number}
   *         Returns an rAF ID that gets used to identify the timeout. It can
   *         also be used in {@link Component#cancelAnimationFrame} to cancel
   *         the animation frame callback.
   *
   * @listens Component#dispose
   * @see [Similar to]{@link https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame}
   */
  requestAnimationFrame(fn) {
    // Fall back to using a timer.
    if (!this.supportsRaf_) {
      return this.setTimeout(fn, 1000 / 60);
    }

    this.clearTimersOnDispose_();

    // declare as variables so they are properly available in rAF function
    // eslint-disable-next-line
    var id;
    fn = Fn.bind(this, fn);

    id = window.requestAnimationFrame(() => {
      if (this.rafIds_.has(id)) {
        this.rafIds_.delete(id);
      }
      fn();
    });
    this.rafIds_.add(id);

    return id;
  },

  /**
   * Request an animation frame, but only one named animation
   * frame will be queued. Another will never be added until
   * the previous one finishes.
   *
   * @param {string} name
   *        The name to give this requestAnimationFrame
   *
   * @param  {Component~GenericCallback} fn
   *         A function that will be bound to this component and executed just
   *         before the browser's next repaint.
   */
  requestNamedAnimationFrame(name, fn) {
    if (this.namedRafs_.has(name)) {
      return;
    }
    this.clearTimersOnDispose_();

    fn = Fn.bind(this, fn);

    const id = this.requestAnimationFrame(() => {
      fn();
      if (this.namedRafs_.has(name)) {
        this.namedRafs_.delete(name);
      }
    });

    this.namedRafs_.set(name, id);

    return name;
  },

  /**
   * Cancels a current named animation frame if it exists.
   *
   * @param {string} name
   *        The name of the requestAnimationFrame to cancel.
   */
  cancelNamedAnimationFrame(name) {
    if (!this.namedRafs_.has(name)) {
      return;
    }

    this.cancelAnimationFrame(this.namedRafs_.get(name));
    this.namedRafs_.delete(name);
  },

  /**
   * Cancels a queued callback passed to {@link Component#requestAnimationFrame}
   * (rAF).
   *
   * If you queue an rAF callback via {@link Component#requestAnimationFrame},
   * use this function instead of `window.cancelAnimationFrame`. If you don't,
   * your dispose listener will not get cleaned up until {@link Component#dispose}!
   *
   * @param {number} id
   *        The rAF ID to clear. The return value of {@link Component#requestAnimationFrame}.
   *
   * @return {number}
   *         Returns the rAF ID that was cleared.
   *
   * @see [Similar to]{@link https://developer.mozilla.org/en-US/docs/Web/API/window/cancelAnimationFrame}
   */
  cancelAnimationFrame(id) {
    // Fall back to using a timer.
    if (!this.supportsRaf_) {
      return this.clearTimeout(id);
    }

    if (this.rafIds_.has(id)) {
      this.rafIds_.delete(id);
      window.cancelAnimationFrame(id);
    }

    return id;
  },

  /**
   * A function to setup `requestAnimationFrame`, `setTimeout`,
   * and `setInterval`, clearing on dispose.
   *
   * > Previously each timer added and removed dispose listeners on it's own.
   * For better performance it was decided to batch them all, and use `Set`s
   * to track outstanding timer ids.
   *
   * @private
   */
  clearTimersOnDispose_() {
    if (this.clearingTimersOnDispose_) {
      return;
    }

    this.clearingTimersOnDispose_ = true;
    this.one('dispose', () => {
      [
        ['namedRafs_', 'cancelNamedAnimationFrame'],
        ['rafIds_', 'cancelAnimationFrame'],
        ['setTimeoutIds_', 'clearTimeout'],
        ['setIntervalIds_', 'clearInterval']
      ].forEach(([idName, cancelName]) => {
        // for a `Set` key will actually be the value again
        // so forEach((val, val) =>` but for maps we want to use
        // the key.
        this[idName].forEach((val, key) => this[cancelName](key));
      });

      this.clearingTimersOnDispose_ = false;
    });
  }

};

const asyncTimers = function(target, options) {
  if (!isEvented) {
    evented(target, options);
  }

  target.setTimeoutIds_ = new Set();
  target.setIntervalIds_ = new Set();
  target.rafIds_ = new Set();
  target.namedRafs_ = new Map();
  target.clearingTimersOnDispose_ = false;

  /**
   * Whether or not this asyncTimerMixin supports `requestAnimationFrame`.
   *
   * This is exposed primarily for testing purposes.
   *
   * @private
   * @type {Boolean}
   */
  target.supportsRaf_ = typeof window.requestAnimationFrame === 'function' &&
    typeof window.cancelAnimationFrame === 'function';

  Obj.assign(target, AsyncTimersMixin);

  return target;
};

export default asyncTimers;

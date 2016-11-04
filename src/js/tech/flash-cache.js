/**
 * @file flash-cache.js
 *
 * Auto-caching method wrapper to avoid calling through to Flash too
 * often.
 */

/**
 * Returns a new getter function that returns a cached value if
 * invoked multiple times within the specified duration.
 *
 * @param {Function} getter the function to be cached
 * @param {Number} cacheDuration the number of milliseconds to cache
 * results for
 * @return {Function} a new function that returns cached results if
 * invoked multiple times within the cache duration
 */
export default function timeExpiringCache(getter, cacheDuration) {
  const result = function cachedGetter() {
    const now = new Date().getTime();

    if (now - result.lastCheckTime_ >= cacheDuration) {
      result.lastCheckTime_ = now;
      result.cache_ = getter();
    }
    return result.cache_;
  };

  result.lastCheckTime_ = -Infinity;
  return result;
}

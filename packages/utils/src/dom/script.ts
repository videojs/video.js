const cache = new Map<string, Promise<void>>();

export function hasScript(src: string): boolean {
  for (const script of document.scripts) {
    if (script.getAttribute('src') === src) return true;
  }

  return false;
}

/**
 * Load a script once. Concurrent and repeat calls for the same `src` share a single promise; failed loads are evicted
 * (and the tag removed) so they can be retried.
 *
 * @internal
 */
export function loadScript(src: string): Promise<void> {
  let promise = cache.get(src);
  if (promise) return promise;

  // Assume a tag we didn't create (e.g. added directly in HTML) has loaded or will load.
  if (hasScript(src)) return Promise.resolve();

  promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');

    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => {
      script.remove();
      reject(new Error(`Failed to load script: ${src}`));
    };
    document.head.appendChild(script);
  });

  cache.set(src, promise);
  // Evict on failure so callers can retry; must not propagate the rejection.
  promise.catch(() => cache.delete(src));

  return promise;
}

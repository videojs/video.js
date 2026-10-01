const subscribers = new Set<() => void>();
let observer: MutationObserver | undefined;
let queued = false;

const flush = (): void => {
  queued = false;

  for (const cb of subscribers) {
    cb();
  }
};

const schedule = (): void => {
  if (!queued) {
    queued = true;
    queueMicrotask(flush);
  }
};

function start(): void {
  if (observer || typeof document === 'undefined') {
    return;
  }

  observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, {
    subtree: true,
    attributes: true,
    attributeFilter: ['lang'],
    childList: true,
  });
}

function stop(): void {
  if (subscribers.size || !observer) {
    return;
  }

  observer.disconnect();
  observer = undefined;
  queued = false;
}

/**
 * Subscribes to DOM updates that can change inherited `lang`: any `lang` attribute edit, or subtree structural changes
 * under `<html>` (which can move nodes between labeled ancestors).
 *
 * @internal
 */
export function subscribeAmbientLang(onStoreChange: () => void): () => void {
  if (typeof document === 'undefined') {
    return () => {};
  }

  subscribers.add(onStoreChange);
  start();

  return () => {
    subscribers.delete(onStoreChange);
    stop();
  };
}

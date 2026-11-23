import { loadCastFramework, onCastApiAvailable } from './utils';

type CastFrameworkCallback = (framework: typeof cast.framework) => void;

export let castFramework: typeof cast.framework | undefined;

let pendingCastFramework: Promise<typeof cast.framework> | null = null;
const castFrameworkCallbacks = new Set<CastFrameworkCallback>();

/**
 * Call `callback` once the Cast framework is available, right away when it already is. Doesn't load the framework.
 *
 * @returns A function that cancels the call.
 */
export function whenCastFramework(callback: CastFrameworkCallback): () => void {
  if (castFramework) {
    callback(castFramework);
    return () => {};
  }

  castFrameworkCallbacks.add(callback);

  return () => castFrameworkCallbacks.delete(callback);
}

export async function ensureCastFramework(): Promise<typeof cast.framework> {
  if (castFramework) return castFramework;

  if (!pendingCastFramework) {
    pendingCastFramework = loadCastFramework().then(
      () =>
        new Promise<typeof cast.framework>((resolve, reject) => {
          onCastApiAvailable(() => {
            registerCastFramework();

            if (castFramework) {
              resolve(castFramework);
              return;
            }

            reject(new DOMException('Google Cast framework is unavailable.', 'NotSupportedError'));
          });
        })
    );

    // Reset on failure (e.g. script blocked by an ad-blocker) so a later
    // attempt can retry instead of replaying a cached rejection.
    pendingCastFramework.catch(() => {
      pendingCastFramework = null;
    });
  }

  return pendingCastFramework;
}

function registerCastFramework(): void {
  if (!globalThis.chrome?.cast?.isAvailable) {
    if (__DEV__) {
      console.debug('chrome.cast.isAvailable', globalThis.chrome?.cast?.isAvailable);
    }

    return;
  }

  if (castFramework) return;

  castFramework = cast.framework;

  for (const callback of castFrameworkCallbacks) callback(castFramework);

  castFrameworkCallbacks.clear();
}

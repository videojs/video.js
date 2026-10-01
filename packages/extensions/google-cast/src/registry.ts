import type { GoogleCastProvider } from './provider';
import { getCastContext, IterableWeakSet, loadCastFramework, onCastApiAvailable } from './utils';

export const googleCastInstances = new IterableWeakSet<GoogleCastProvider>();

export let castFramework: typeof cast.framework | undefined;

let pendingCastFramework: Promise<typeof cast.framework> | null = null;

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

  if (!castFramework) {
    castFramework = cast.framework;

    getCastContext()!.addEventListener(castFramework.CastContextEventType.CAST_STATE_CHANGED, () => {
      googleCastInstances.forEach((provider) => provider.onCastStateChanged());
    });

    getCastContext()!.addEventListener(castFramework.CastContextEventType.SESSION_STATE_CHANGED, () => {
      googleCastInstances.forEach((provider) => provider.onSessionStateChanged());
    });

    googleCastInstances.forEach((provider) => provider.onCastFrameworkAvailable());
  }
}

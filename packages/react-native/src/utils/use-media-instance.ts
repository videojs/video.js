import { isUndefined } from '@videojs/utils/predicate';
import { useState } from 'react';

import type { ReactNativeMedia } from '../media/react-native-media';
import { useOptionalMedia } from '../player/context';
import { useInstance } from './use-instance';

/**
 * Destroyed in place of media this component does not own, so the player's adapter is left untouched.
 *
 * A distinct class so it does not collapse into `ReactNativeMedia`: both have `destroy()`.
 */
class UnownedMedia {
  destroy() {}
}

const NOT_OWNED = new UnownedMedia();

function isUnowned(value: ReactNativeMedia | UnownedMedia): value is UnownedMedia {
  return value === NOT_OWNED;
}

/**
 * Resolve the media instance a component should drive.
 *
 * Inside a `<VideoPlayer>` this returns the player's adapter, so the media component renders a surface for the player
 * that already exists. Standalone it creates and owns one, which is what keeps `<Video>` usable on its own. An owned
 * instance destroyed while hidden in a React `<Activity>` is replaced when it is shown again.
 *
 * Ownership decides teardown: a created instance is destroyed on unmount, a provided one is left alone — never
 * destroyed and never recreated — because the player outlives its children and replaces its own adapter. The choice is
 * made once, on the first render, from whether a player is present; changing that afterwards would mean a different
 * provider, which remounts the subtree anyway.
 *
 * Creating during render rather than in an effect keeps the handle usable immediately, with no null pass before the
 * surface can bind.
 *
 * Concrete rather than generic over the media class, unlike the web counterpart: react-native has exactly one adapter
 * today. Reintroduce the type parameter when a second appears.
 *
 * @param MediaClass - Media class to instantiate when no player provides one.
 * @param setup - Optional callback run on mount for each owned instance, and once for provided media. Skipped on
 *   StrictMode's simulated re-mount.
 */
export function useMediaInstance(
  MediaClass: new () => ReactNativeMedia,
  setup?: (media: ReactNativeMedia) => void
): ReactNativeMedia {
  const provided = useOptionalMedia();
  const [owns] = useState(() => isUndefined(provided));

  const owned = useInstance(() => (owns ? new MediaClass() : NOT_OWNED), {
    setup(instance) {
      if (isUnowned(instance)) {
        if (isUndefined(provided)) throw new Error('@videojs/react-native: no media instance available.');

        setup?.(provided);
        return;
      }

      setup?.(instance);
    },
  });

  if (!owns) {
    if (isUndefined(provided)) throw new Error('@videojs/react-native: no media instance available.');

    return provided;
  }

  if (isUnowned(owned)) throw new Error('@videojs/react-native: no media instance available.');

  return owned;
}

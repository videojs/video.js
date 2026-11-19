import { isNull, isUndefined } from '@videojs/utils/predicate';
import { useMemo, useState } from 'react';

import type { ReactNativeMedia } from '../media/react-native-media';
import { useOptionalMedia } from '../player/context';
import { useDestroy } from './use-destroy';

/** Stand-in so `useDestroy` can be called unconditionally for an instance this component does not own. */
const NOT_OWNED = { destroy: () => {} };

/**
 * Resolve the media instance a component should drive.
 *
 * Inside a `<VideoPlayer>` this returns the player's adapter, so the media component renders a surface for the player
 * that already exists. Standalone it creates and owns one, which is what keeps `<Video>` usable on its own.
 *
 * Ownership decides teardown: a created instance is destroyed on unmount, a provided one is left alone because the
 * player outlives its children. The choice is made once, on the first render, from whether a player is present —
 * changing that afterwards would mean a different provider, which remounts the subtree anyway.
 *
 * Creating during render rather than in an effect keeps the handle usable immediately, with no null pass before the
 * surface can bind.
 *
 * Concrete rather than generic over the media class, unlike the web counterpart: react-native has exactly one adapter
 * today. Reintroduce the type parameter when a second appears.
 *
 * @param MediaClass - Media class to instantiate when no player provides one.
 * @param setup - Optional callback run once on mount, before first use.
 */
export function useMediaInstance(
  MediaClass: new () => ReactNativeMedia,
  setup?: (media: ReactNativeMedia) => void
): ReactNativeMedia {
  const provided = useOptionalMedia();

  // Only constructed when nothing is provided — `new ReactNativeMedia()` allocates a native player, so building one
  // speculatively would leak a handle.
  const [owned] = useState(() => (isUndefined(provided) ? new MediaClass() : null));

  const instance = isNull(owned) ? provided : owned;
  if (isUndefined(instance)) throw new Error('@videojs/react-native: no media instance available.');

  const destroyable = useMemo(() => owned ?? NOT_OWNED, [owned]);

  useDestroy(destroyable, () => setup?.(instance));

  return instance;
}

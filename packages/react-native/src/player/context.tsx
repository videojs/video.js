import type { UnknownState, UnknownStore } from '@videojs/store';
import { useStore } from '@videojs/store/react';
import { isNull } from '@videojs/utils/predicate';
import { createContext, type ReactNode, useContext } from 'react';

import type { ReactNativeMedia } from '../media/react-native-media';

/**
 * Mirrors the web `PlayerContextValue` minus its container half — there is no `container`/`setContainer` here because
 * `PlayerTarget.container` is still `HTMLElement`-typed. See `NativePlayerTarget`.
 *
 * `media` is provided by `<VideoPlayer>` rather than pushed up by the media component, so there is no `setMedia`
 * either. The web direction (media component owns the instance and registers it) becomes possible once more than one
 * media kind exists.
 */
export interface NativePlayerContextValue {
  store: UnknownStore;
  media: ReactNativeMedia;
}

const NativePlayerContext = createContext<NativePlayerContextValue | null>(null);

export function NativePlayerContextProvider({
  value,
  children,
}: {
  value: NativePlayerContextValue;
  children: ReactNode;
}): ReactNode {
  return <NativePlayerContext.Provider value={value}>{children}</NativePlayerContext.Provider>;
}

/** Access the full player context. Throws outside a `<VideoPlayer>`. */
export function useNativePlayerContext(): NativePlayerContextValue {
  const context = useContext(NativePlayerContext);
  if (isNull(context)) throw new Error('@videojs/react-native: this hook must be used within a <VideoPlayer>.');

  return context;
}

/**
 * Access the player store, or subscribe to a value selected from it.
 *
 * Untyped like the web standalone hook: state reads as `unknown` unless you pass a premade selector such as
 * `selectNativePlayback` to recover the type from its return value.
 *
 * @label Without Selector
 */
export function usePlayer(): UnknownStore;
/**
 * @param selector - Derives the value this component subscribes to.
 * @label With Selector
 */
export function usePlayer<R>(selector: (state: UnknownState) => R): R;
export function usePlayer<R>(selector?: (state: UnknownState) => R) {
  const { store } = useNativePlayerContext();

  return useStore(store, selector as any);
}

/** Access the player's media adapter. Throws outside a `<VideoPlayer>`. */
export function useMedia(): ReactNativeMedia {
  return useNativePlayerContext().media;
}

/**
 * Access the player's media adapter when one is available.
 *
 * Returns `undefined` outside a `<VideoPlayer>` rather than throwing, so media components stay usable standalone — the
 * same convention web's `useMediaAttach` follows.
 */
export function useOptionalMedia(): ReactNativeMedia | undefined {
  return useContext(NativePlayerContext)?.media;
}

'use client';

import type { MediaContainer } from '@videojs/core/dom';
import type { Media } from '@videojs/media';
import type { UnknownState, UnknownStore } from '@videojs/store';
import { useStore } from '@videojs/store/react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useContext } from 'react';

export interface PlayerContextValue {
  store: UnknownStore;
  media: Media | null;
  setMedia: Dispatch<SetStateAction<Media | null>>;
  container: MediaContainer | null;
  setContainer: Dispatch<SetStateAction<HTMLElement | null>>;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);
const EMPTY_UNSUBSCRIBE = () => {};
const EMPTY_STORE = {
  state: {} as UnknownState,
  subscribe: () => EMPTY_UNSUBSCRIBE,
} as Pick<UnknownStore, 'state' | 'subscribe'>;

export function PlayerContextProvider({
  value,
  children,
}: {
  value: PlayerContextValue;
  children: ReactNode;
}): ReactNode {
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

/** Access the full player context value. Throws if used outside a Player. */
export function usePlayerContext(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayerContext must be used within a Player');

  return ctx;
}

/**
 * Access the player store from within a Player.
 *
 * This standalone hook has no knowledge of your configured features, so it returns an untyped `UnknownStore` whose
 * state properties are typed as `unknown`. For typed access, use the `usePlayer` returned by `createPlayer()`, or pass
 * a premade selector to recover the type from its return value.
 *
 * @label Without Selector
 */
export function usePlayer(): UnknownStore;
/**
 * Select a value from the player store. Re-renders when the selected value changes.
 *
 * The selector receives `UnknownState`, so an inline selector returns `unknown`. Pass a premade selector (e.g.
 * `selectPlayback`) to get a typed result.
 *
 * @param selector - Derives a value from the player store state.
 * @label With Selector
 */
export function usePlayer<R>(selector: (state: UnknownState) => R): R;
export function usePlayer<R>(selector?: (state: UnknownState) => R) {
  const { store } = usePlayerContext();

  return useStore(store, selector as any);
}

/**
 * Returns the player store when available, or `undefined` outside a Player.
 *
 * @label Without Selector
 */
export function useOptionalPlayer(): UnknownStore | undefined;
/**
 * Selects a player value when available, or returns `undefined` outside a Player.
 *
 * @param selector - Derives a value from the player store state.
 * @label With Selector
 */
export function useOptionalPlayer<R>(selector: (state: UnknownState) => R): R | undefined;
export function useOptionalPlayer<R>(selector?: (state: UnknownState) => R) {
  const ctx = useContext(PlayerContext);
  const store = (ctx?.store ?? (EMPTY_STORE as unknown as UnknownStore)) as UnknownStore;
  const value = useStore(store, (ctx ? selector : undefined) as any);

  return ctx ? value : undefined;
}

/** Access the media element from within a Player. */
export function useMedia(): Media | null {
  const { media } = usePlayerContext();

  return media;
}

/** Access the container element from within a Player. */
export function useContainer(): MediaContainer | null {
  const { container } = usePlayerContext();

  return container;
}

/** Access the container element when a Player is available. */
export function useOptionalContainer(): MediaContainer | null {
  const ctx = useContext(PlayerContext);

  return ctx?.container ?? null;
}

/** Access the media attach setter for connecting a media element to the player. */
export function useMediaAttach(): Dispatch<SetStateAction<Media | null>> | undefined {
  const ctx = useContext(PlayerContext);

  return ctx?.setMedia;
}

/** Access the container attach setter for connecting a container element to the player. */
export function useContainerAttach(): Dispatch<SetStateAction<HTMLElement | null>> | undefined {
  const ctx = useContext(PlayerContext);

  return ctx?.setContainer;
}

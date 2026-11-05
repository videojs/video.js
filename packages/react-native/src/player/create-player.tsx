import type { AnySlice, InferStoreState, Store, UnionSliceState } from '@videojs/store';
import { combine, createStore } from '@videojs/store';
import { useStore } from '@videojs/store/react';
import { type FC, type ReactNode, useEffect, useMemo, useState } from 'react';

import { ReactNativeMedia } from '../media/react-native-media';
import type { NativePlayerTarget } from '../store/native-player-target';
import { useDestroy } from '../utils/use-destroy';
import { NativePlayerContextProvider, useMedia, useNativePlayerContext } from './context';

/** A feature that can compose into a react-native player store. */
export type AnyNativeFeature = AnySlice<NativePlayerTarget>;

/** A player store composed from `Features`. */
export type NativePlayerStore<Features extends AnyNativeFeature[] = []> = Store<
  NativePlayerTarget,
  UnionSliceState<Features>
>;

/** A player store with unknown features. */
export type AnyNativePlayerStore = Store<NativePlayerTarget, object>;

/** Configures the store and component produced by {@link createPlayer}. */
export interface CreatePlayerConfig<Features extends AnyNativeFeature[]> {
  /** Features combined into the player's store, state and actions. */
  features: Features;

  /** Name shown for the generated component in development tools. */
  displayName?: string;
}

/**
 * Props accepted by a generated Player.
 *
 * Just `children`: the component renders no host element, and there are no feature-declared inputs to forward. Web
 * additionally derives config props from its features and diffs them into store actions through
 * `combinePlayerFeatureConfigs` / `setPlayerConfigValue`. Those need `definePlayerFeature`'s `config` property and
 * `@videojs/core/dom`; nothing here declares one yet.
 */
export interface PlayerProps {
  children?: ReactNode | undefined;
}

/** Typed player-store hook returned by {@link createPlayer}. */
export type UsePlayerHook<PlayerStore extends NativePlayerStore> = {
  /** Returns the configured store without subscribing. */
  (): PlayerStore;

  /**
   * Subscribes to a value derived from the player state.
   *
   * @param selector - Derives the value consumed by the calling component.
   */
  <R>(selector: (state: InferStoreState<PlayerStore>) => R): R;
};

/**
 * Design notes: This type could be made generic to support more types of EngineAdapter, if we ever wanted to. (Maybe
 * supporting SPF for instance, or other native players like RNV/expo-video (though why?))
 */

/** The component and typed hooks produced by {@link createPlayer}. */
export interface CreatePlayerResult<PlayerStore extends NativePlayerStore> {
  /** Provides a new player store and media adapter to its descendants. Renders no host element. */
  Player: FC<PlayerProps>;

  /** Accesses the configured store, or subscribes to a value selected from it. */
  usePlayer: UsePlayerHook<PlayerStore>;

  /** Returns the player's media adapter. */
  useMedia: () => ReactNativeMedia;
}

/**
 * Create a player component whose store is composed from `features`.
 *
 * @param config - Features to compose, plus an optional display name.
 */
export function createPlayer<const Features extends AnyNativeFeature[]>(
  config: CreatePlayerConfig<Features>
): CreatePlayerResult<NativePlayerStore<Features>>;

// Non-generic on purpose. `combine`'s target is `UnionToIntersection<InferSliceTarget<...>>`, which
// stays deferred while `Features` is unresolved and then fails the `AnySlice<Target>` constraint on
// `createStore`. Precision lives in the overload above; the body works in concrete types.
export function createPlayer(config: CreatePlayerConfig<AnyNativeFeature[]>): CreatePlayerResult<AnyNativePlayerStore> {
  const slice = combine(...config.features);

  function Player({ children }: PlayerProps): ReactNode {
    // Both created during render, not in an effect, so `media.handle` is already non-null on the
    // first render and the surface never has a null pass to render around.
    const [media] = useState(() => new ReactNativeMedia());
    const [store] = useState(() => createStore<NativePlayerTarget>()(slice));

    useDestroy(store);
    useDestroy(media);

    useEffect(() => store.attach({ media, container: null }), [store, media]);

    const value = useMemo(() => ({ store, media }), [store, media]);

    return <NativePlayerContextProvider value={value}>{children}</NativePlayerContextProvider>;
  }

  if (__DEV__ && config.displayName) Player.displayName = config.displayName;

  function usePlayer<R>(selector?: (state: object) => R): AnyNativePlayerStore | R {
    const { store } = useNativePlayerContext();

    return useStore(store, selector as any);
  }

  return { Player, usePlayer, useMedia };
}

import {
  type AnyPlayerFeature,
  combinePlayerFeatureConfigs,
  type PlayerFeatureConfig,
  setPlayerConfigValue,
  type UnionPlayerConfig,
} from '@videojs/core';
import type { InferStoreState, Store, UnionSliceState } from '@videojs/store';
import { combine, createStore } from '@videojs/store';
import { useStore } from '@videojs/store/react';
import { pick } from '@videojs/utils/object';
import { type FC, type ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { ReactNativeMedia } from '../media/react-native-media';
import type { NativePlayerTarget } from '../store/native-player-target';
import { useDestroy } from '../utils/use-destroy';
import { NativePlayerContextProvider, useMedia, useNativePlayerContext } from './context';

/** A feature that can compose into a react-native player store, along with the config inputs it declares. */
export type AnyNativeFeature = AnyPlayerFeature<NativePlayerTarget>;

/** A player store composed from `Features`. */
export type NativePlayerStore<Features extends AnyNativeFeature[] = []> = Store<
  NativePlayerTarget,
  UnionSliceState<Features>
>;

/** A player store with unknown features. */
export type AnyNativePlayerStore = Store<NativePlayerTarget, object>;

/**
 * Config inputs by name. `PlayerFeatureConfig` only admits inputs of these types, so the values a Player forwards are
 * always one of them.
 */
type PlayerConfigValues = Record<string, string | readonly number[] | null | undefined>;

/** Configures the store and component produced by {@link createPlayer}. */
export interface CreatePlayerConfig<Features extends AnyNativeFeature[]> {
  /** Features combined into the player's store, state, actions and config props. */
  features: Features;

  /** Name shown for the generated component in development tools. */
  displayName?: string;
}

/**
 * Props accepted by a generated Player: the config inputs its features declare, such as `metadata`'s `title` and
 * `poster` or `playbackRate`'s `defaultPlaybackRates`, plus `children`. The component renders no host element.
 */
export type PlayerProps<Config = object> = {
  [Key in keyof Config]?: Config[Key] | undefined;
} & {
  children?: ReactNode | undefined;
};

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
export interface CreatePlayerResult<PlayerStore extends NativePlayerStore, Config = object> {
  /** Provides a new player store and media adapter to its descendants. Renders no host element. */
  Player: FC<PlayerProps<Config>>;

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
): CreatePlayerResult<NativePlayerStore<Features>, UnionPlayerConfig<Features>>;

// Non-generic on purpose. `combine`'s target is `UnionToIntersection<InferSliceTarget<...>>`, which
// stays deferred while `Features` is unresolved and then fails the `AnySlice<Target>` constraint on
// `createStore`. Precision lives in the overload above; the body works in concrete types.
export function createPlayer(config: CreatePlayerConfig<AnyNativeFeature[]>): CreatePlayerResult<AnyNativePlayerStore> {
  const slice = combine(...config.features);
  const featureConfig = combinePlayerFeatureConfigs(config.features);
  const configKeys = Object.keys(featureConfig);

  function createConfiguredStore(values: PlayerConfigValues) {
    const store = createStore<NativePlayerTarget>()(slice);

    applyConfigValues(store, featureConfig, values);
    return store;
  }

  function Player(props: PlayerProps<PlayerConfigValues>): ReactNode {
    const { children } = props;
    // Only inputs declared by the selected features are forwarded to store actions.
    const configValues = pick(props, configKeys);

    // Both created during render, not in an effect, so `media.handle` is already non-null on the
    // first render and the surface never has a null pass to render around. The store starts from
    // this render's config so features never run on defaults the props override.
    const [media] = useState(() => new ReactNativeMedia());
    const [store] = useState(() => createConfiguredStore(configValues));
    const syncedValues = useRef(configValues);

    useDestroy(store);
    useDestroy(media);

    // Forwards committed config changes, and only the inputs that changed, as web's Player does.
    useLayoutEffect(() => {
      const previous = syncedValues.current;

      for (const key of configKeys) {
        if (Object.is(previous[key], configValues[key])) continue;

        setPlayerConfigValue(store, featureConfig[key]!, configValues[key]);
      }

      syncedValues.current = configValues;
    });

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

// An absent input is forwarded too: each config action restores its default for `undefined`.
function applyConfigValues(store: AnyNativePlayerStore, config: PlayerFeatureConfig, values: PlayerConfigValues): void {
  for (const key of Object.keys(config)) {
    setPlayerConfigValue(store, config[key]!, values[key]);
  }
}

'use client';

import {
  type AnyPlayerFeature,
  type AnyPlayerStore,
  type AudioFeatures,
  type AudioPlayerStore,
  combinePlayerFeatureConfigs,
  type InferPlayerConfig,
  type PlayerFeatureConfig,
  type PlayerStore,
  type PlayerTarget,
  setPlayerConfigValue,
  type VideoFeatures,
  type VideoPlayerStore,
} from '@videojs/core/dom';
import type { Media } from '@videojs/media/dom';
import type { InferStoreState } from '@videojs/store';
import { combine, createStore } from '@videojs/store';
import { useStore } from '@videojs/store/react';
import { pick } from '@videojs/utils/object';
import type { FC, ReactNode } from 'react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useDestroy } from '../utils/use-destroy';
import { PlayerContextProvider, useMedia, usePlayerContext } from './context';

/** Configures the feature-backed store and provider component created by {@link createPlayer}. */
export interface CreatePlayerConfig<Features extends AnyPlayerFeature[]> {
  /** Features combined into the player's store, state, actions, and configuration props. */
  features: Features;

  /** Name shown for the generated provider component in development tools. */
  displayName?: string;
}

/** Props accepted by a generated Player provider. */
export type PlayerProps<Config = object> = {
  [Key in keyof Config]?: Config[Key] | undefined;
} & {
  /** Content placed inside the player context. The provider does not render a host element of its own. */
  children: ReactNode;
};

/** The provider component and typed hooks produced by {@link createPlayer}. */
export interface CreatePlayerResult<Store extends PlayerStore> {
  /** Provides a new player store to its descendants without adding a layout element. */
  Player: FC<PlayerProps<InferPlayerConfig<Store>>>;

  /** Accesses the configured store, or subscribes to a selected value from it. */
  usePlayer: UsePlayerHook<Store>;

  /** Returns the media currently attached beneath the generated Player, or `null` before attachment. */
  useMedia: () => Media | null;
}

/** Typed player-store hook returned by {@link createPlayer}. */
export type UsePlayerHook<Store extends PlayerStore> = {
  /** Returns the configured player store. */
  (): Store;

  /**
   * Subscribes to a value derived from the player state.
   *
   * @param selector - Derives the value consumed by the calling component.
   */
  <R>(selector: (state: InferStoreState<Store>) => R): R;
};

/**
 * Create a player instance with a typed Player component and hooks.
 *
 * @param config - Player configuration with features and optional display name.
 * @label Video
 */
export function createPlayer(config: CreatePlayerConfig<VideoFeatures>): CreatePlayerResult<VideoPlayerStore>;

/**
 * Create a player for audio media.
 *
 * @param config - Player configuration with features and optional display name.
 * @label Audio
 */
export function createPlayer(config: CreatePlayerConfig<AudioFeatures>): CreatePlayerResult<AudioPlayerStore>;

/**
 * Create a player with custom features.
 *
 * @param config - Player configuration with features and optional display name.
 * @label Generic
 */
export function createPlayer<const Features extends AnyPlayerFeature[]>(
  config: CreatePlayerConfig<Features>
): CreatePlayerResult<PlayerStore<Features>>;

export function createPlayer(config: CreatePlayerConfig<AnyPlayerFeature[]>): CreatePlayerResult<AnyPlayerStore> {
  const slice = combine(...config.features);
  const featureConfig = combinePlayerFeatureConfigs(config.features);
  const configKeys = Object.keys(featureConfig);

  function createConfiguredStore(values: Record<string, unknown>) {
    const store = createStore<PlayerTarget>()(slice);

    applyConfigValues(store, featureConfig, values);
    return store;
  }

  function Player(props: PlayerProps<any>): ReactNode {
    const { children } = props;
    // Only inputs declared by selected features are forwarded to store actions.
    const configValues = pick(props, configKeys);
    const [store, setStore] = useState(() => createConfiguredStore(configValues));
    const syncedValues = useRef({ store, values: configValues });

    const [media, setMedia] = useState<Media | null>(null);
    const [container, setContainer] = useState<HTMLElement | null>(null);

    useDestroy(store);

    // Sync committed configuration props to the existing store.
    useLayoutEffect(() => {
      const previous = syncedValues.current;

      // Replacement stores are seeded from this render's props during creation.
      if (previous.store !== store) {
        syncedValues.current = { store, values: configValues };
        return;
      }

      for (const key of configKeys) {
        if (Object.is(previous.values[key], configValues[key])) continue;

        setPlayerConfigValue(store, featureConfig[key]!, configValues[key]);
      }

      syncedValues.current = { store, values: configValues };
    });

    useEffect(() => {
      if (!media) return;

      // The store may have been destroyed during an asynchronous gap between React
      // effect cleanup and re-setup (e.g., React <Activity> hide → reveal). The
      // useState initializer does not re-run in this case.
      if (store.destroyed) {
        setStore(createConfiguredStore(syncedValues.current.values));
        return;
      }

      return store.attach({ media, container });
    }, [media, container, store]);

    const value = useMemo(() => ({ store, media, setMedia, container, setContainer }), [store, media, container]);

    return <PlayerContextProvider value={value}>{children}</PlayerContextProvider>;
  }

  if (__DEV__ && config.displayName) {
    Player.displayName = config.displayName;
  }

  function usePlayer<R>(selector?: (state: object) => R): AnyPlayerStore | R {
    const { store } = usePlayerContext();

    return useStore(store, selector as any);
  }

  return {
    Player,
    usePlayer,
    useMedia,
  };
}

function applyConfigValues(store: object, config: PlayerFeatureConfig, values: Record<string, unknown>): void {
  for (const key of Object.keys(config)) {
    setPlayerConfigValue(store, config[key]!, values[key]);
  }
}

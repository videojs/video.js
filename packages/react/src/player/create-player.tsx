'use client';

import {
  type AnyPlayerFeature,
  type AnyPlayerStore,
  type AudioFeatures,
  type AudioPlayerStore,
  combinePlayerFeatureConfigs,
  type InferPlayerConfig,
  type PlayerExtension,
  PlayerExtensionCoordinator,
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
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useDefinedMedia } from '../utils/use-defined-media';
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

    const [requestedMedia, setMedia] = useState<Media | null>(null);
    const media = useDefinedMedia(requestedMedia);
    const [container, setContainer] = useState<HTMLElement | null>(null);

    // Re-attaches the store to the current target; set by the attach effect below while a target is attached.
    const reattach = useRef<(() => void) | null>(null);
    // Created with the player, so its creation time is the player's init time.
    const [extensions] = useState(() => new PlayerExtensionCoordinator(() => reattach.current?.()));
    const registerExtension = useCallback((extension: PlayerExtension) => extensions.register(extension), [extensions]);

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

    // Extensions follow the media, not the container: they detach only when the media goes away or changes, so a
    // container change re-attaches the store without restarting an extension's session.
    useEffect(() => {
      if (!media) return;

      return () => extensions.detach();
    }, [media, extensions]);

    useEffect(() => {
      if (!media) return;

      // The store may have been destroyed during an asynchronous gap between React
      // effect cleanup and re-setup (e.g., React <Activity> hide → reveal). The
      // useState initializer does not re-run in this case.
      if (store.destroyed) {
        setStore(createConfiguredStore(syncedValues.current.values));
        return;
      }

      // Extensions attach before the store so their overrides are in place when
      // features first read the media; the store sees the media through their facade.
      const target: PlayerTarget = { media, container };

      extensions.attach(target);

      let detach = store.attach({ media: extensions.getStoreMedia(media), container });

      // Features hold members read at attach time (such as `remote`), so an extension
      // that overrides media members, added or removed later, re-attaches the store.
      reattach.current = () => {
        detach();
        detach = store.attach({ media: extensions.getStoreMedia(media), container });
      };

      return () => {
        reattach.current = null;
        detach();
      };
    }, [media, container, store, extensions]);

    const value = useMemo(
      () => ({ store, media, setMedia, container, setContainer, registerExtension }),
      [store, media, container, registerExtension]
    );

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

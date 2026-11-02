import {
  createPlayer,
  errorFeature,
  fullscreenFeature,
  type PlayerTarget,
  selectControls,
  useMediaAttach,
} from '@videojs/react';
import { videoFeatures } from '@videojs/react/video';
import { useEffect } from 'react';

import { useControlsLock } from '@/components/blog/CosmicDawnVideo';

export interface SharedMediaPlayerOptions {
  /** Selector for the ancestor that holds the shared video and every skin, which fullscreen must include. */
  stage: string;
  /** Whether the skin inside this container is currently hidden from the reader. */
  isHidden: (container: HTMLElement) => boolean;
  /** The preset's features, such as those for live video or audio; video by default. */
  features?: PlayerFeatures;
}

/** Any preset's feature list, as `createPlayer` accepts it. */
type PlayerFeatures = Parameters<typeof createPlayer>[0]['features'];

/**
 * Create a player whose instances all drive one shared video element, so several skins can sit over the same media.
 * Each skin owns its input handlers; fullscreen takes the whole stage and only a visible skin reports media errors.
 */
export function createSharedMediaPlayer({ stage, isHidden, features = videoFeatures }: SharedMediaPlayerOptions) {
  function fullscreenTarget(target: PlayerTarget): PlayerTarget {
    return { ...target, container: target.container?.closest<HTMLElement>(stage) ?? target.container };
  }

  const sharedFullscreen: typeof fullscreenFeature = {
    ...fullscreenFeature,
    state(context) {
      const state = fullscreenFeature.state;

      // The built-in feature uses a factory; the shared feature type also allows static state.
      // oxlint-disable-next-line anti-slop/no-runtime-typeof
      return typeof state === 'function'
        ? state({ ...context, target: () => fullscreenTarget(context.target()) })
        : state;
    },
    attach(context) {
      return fullscreenFeature.attach?.({ ...context, target: fullscreenTarget(context.target) });
    },
  };

  const sharedError: typeof errorFeature = {
    ...errorFeature,
    attach({ target: { media, container }, signal, set }) {
      if (!(media instanceof HTMLVideoElement)) return;

      media.addEventListener(
        'error',
        () => {
          if (container && !isHidden(container)) set({ error: media.error });
        },
        { signal }
      );
      media.addEventListener('emptied', () => set({ error: null }), { signal });
    },
  };

  const { Player, usePlayer } = createPlayer({
    // SAFETY: every preset shares the controls state `SharedMedia` reads; typing the player as video keeps `Player`'s
    // children prop, which the generic overload for an arbitrary feature list drops.
    features: features.map((feature) => {
      if (feature === fullscreenFeature) return sharedFullscreen;

      if (feature === errorFeature) return sharedError;

      return feature;
    }) as typeof videoFeatures,
  });

  /** Attach the shared video to the surrounding player, optionally keeping its controls on screen. */
  function SharedMedia({ media, lockControls = false }: { media: HTMLVideoElement | null; lockControls?: boolean }) {
    const setMedia = useMediaAttach();
    const requestControlsLock = usePlayer(selectControls)?.requestControlsLock;

    useEffect(() => {
      setMedia?.(media);
      return () => setMedia?.(null);
    }, [media, setMedia]);

    useControlsLock(lockControls ? requestControlsLock : undefined, media);

    return null;
  }

  return { Player, SharedMedia };
}

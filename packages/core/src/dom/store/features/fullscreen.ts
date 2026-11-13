import { isMediaVideoDimensionsCapable, type MediaFullscreenState } from '@videojs/media';
import { listen, type WebKitVideoElement } from '@videojs/utils/dom';

import { definePlayerFeature } from '../../feature';
import type { PlayerFeatureConfig } from '../../player';
import { exitFullscreen, isFullscreen, isFullscreenEnabled, requestFullscreen } from '../../presentation/fullscreen';
import { createScreenOrientationLock, type ScreenOrientationLockType } from '../../presentation/orientation';
import { exitPictureInPicture, isPictureInPicture } from '../../presentation/pip';

interface FullscreenConfigState {
  enableAdaptiveFullScreen: boolean;
  setAdaptiveFullscreenEnabled(value: boolean | null | undefined): void;
}

export const fullscreenFeature = definePlayerFeature({
  name: 'fullscreen',
  config: {
    enableAdaptiveFullScreen: {
      action: 'setAdaptiveFullscreenEnabled',
      state: 'enableAdaptiveFullScreen',
      html: { type: 'boolean' },
    },
  } satisfies PlayerFeatureConfig<MediaFullscreenState & FullscreenConfigState>,
  state: ({ target, set }): MediaFullscreenState & FullscreenConfigState => ({
    isFullscreen: false,
    fullscreenAvailability: 'unavailable',
    enableAdaptiveFullScreen: false,

    setAdaptiveFullscreenEnabled(value) {
      set({ enableAdaptiveFullScreen: value === true });
    },

    async requestFullscreen() {
      const { media, container } = target();

      // Exit PiP first if active (browser behavior is inconsistent)
      if (isPictureInPicture(media)) {
        await exitPictureInPicture(media);
      }

      return requestFullscreen(container, media);
    },

    async exitFullscreen() {
      const { media } = target();

      return exitFullscreen(media);
    },
  }),

  attach({ target, signal, get, set, store }) {
    const { media, container } = target;
    const orientationLock = createScreenOrientationLock((type, error) => {
      console.warn(
        `[vjs-core] Adaptive fullscreen could not lock screen orientation to "${type}".`,
        ...(error === undefined ? [] : [error])
      );
    });
    let syncedOrientation: ScreenOrientationLockType | null = null;

    set({
      fullscreenAvailability: isFullscreenEnabled() ? 'available' : 'unsupported',
    });

    const syncAdaptiveOrientation = () => {
      const { enableAdaptiveFullScreen } = get();

      if (!enableAdaptiveFullScreen || !isFullscreen(container, media)) {
        if (syncedOrientation !== null) orientationLock.unlock();

        syncedOrientation = null;
        return;
      }

      if (!isMediaVideoDimensionsCapable(media)) return;

      if (media.videoWidth <= 0 || media.videoHeight <= 0) return;

      const next: ScreenOrientationLockType = media.videoWidth > media.videoHeight ? 'landscape' : 'portrait';
      if (next === syncedOrientation) return;

      syncedOrientation = next;
      void orientationLock.lock(next);
    };

    const sync = () => {
      set({
        isFullscreen: isFullscreen(container, media),
      });
      syncAdaptiveOrientation();
    };

    sync();

    listen(document, 'fullscreenchange', sync, { signal });
    listen(document, 'webkitfullscreenchange', sync, { signal });
    listen(media, 'loadedmetadata', syncAdaptiveOrientation, { signal });
    listen(media, 'resize', syncAdaptiveOrientation, { signal });

    // iOS Safari presentation mode change (covers fullscreen)
    const video = media as WebKitVideoElement;

    if ('webkitPresentationMode' in video) {
      listen(media, 'webkitpresentationmodechanged', sync, { signal });
    }

    const unsubscribe = store.subscribe(syncAdaptiveOrientation);

    signal.addEventListener(
      'abort',
      () => {
        unsubscribe();
        orientationLock.unlock();
      },
      { once: true }
    );
  },
});

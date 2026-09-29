import type { MediaFullscreenState } from '@videojs/media';
import { listen, type WebKitVideoElement } from '@videojs/utils/dom';

import { definePlayerFeature } from '../../feature';
import { exitFullscreen, isFullscreen, isFullscreenEnabled, requestFullscreen } from '../../presentation/fullscreen';
import { exitPictureInPicture, isPictureInPicture } from '../../presentation/pip';

export const fullscreenFeature = definePlayerFeature({
  name: 'fullscreen',
  state: ({ target }): MediaFullscreenState => ({
    isFullscreen: false,
    fullscreenAvailability: 'unavailable',

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

  attach({ target, signal, set }) {
    const { media, container } = target;

    set({
      fullscreenAvailability: isFullscreenEnabled() ? 'available' : 'unsupported',
    });

    const sync = () =>
      set({
        isFullscreen: isFullscreen(container, media),
      });

    sync();

    listen(document, 'fullscreenchange', sync, { signal });
    listen(document, 'webkitfullscreenchange', sync, { signal });

    // iOS Safari presentation mode change (covers fullscreen)
    const video = media as WebKitVideoElement;

    if ('webkitPresentationMode' in video) {
      listen(media, 'webkitpresentationmodechanged', sync, { signal });
    }
  },
});

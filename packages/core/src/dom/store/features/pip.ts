import type { MediaPictureInPictureState } from '@videojs/media';
import { hasMetadata, isMediaSourceCapable } from '@videojs/media';
import { listen, type WebKitVideoElement } from '@videojs/utils/dom';

import { definePlayerFeature } from '../../feature';
import { exitFullscreen, isFullscreen } from '../../presentation/fullscreen';
import {
  exitPictureInPicture,
  isPictureInPicture,
  isPictureInPictureCapable,
  isPictureInPictureEnabled,
  requestPictureInPicture,
} from '../../presentation/pip';

export const pipFeature = definePlayerFeature({
  name: 'pip',
  state: ({ target }): MediaPictureInPictureState => ({
    isPictureInPicture: false,
    pictureInPictureAvailability: 'unavailable',

    async requestPictureInPicture() {
      const { media, container } = target();
      if (!isPictureInPictureCapable(media)) return;

      // Refuse before leaving fullscreen, or a request the media rejects would also drop the player out of fullscreen.
      if (!isMediaSourceCapable(media) || !hasMetadata(media)) {
        throw new DOMException('The media has no video data yet.', 'InvalidStateError');
      }

      // Exit fullscreen first if active
      if (isFullscreen(container, media)) {
        await exitFullscreen(media);
      }

      return requestPictureInPicture(media);
    },

    async exitPictureInPicture() {
      const { media } = target();

      return exitPictureInPicture(media);
    },
  }),

  attach({ target, signal, set }) {
    const { media } = target;
    const supported = isPictureInPictureEnabled() && isPictureInPictureCapable(media);

    // Both halves have to hold: the browser has to offer picture-in-picture, and
    // this media has to be able to enter it. Asking only the browser leaves an
    // embed that has no picture-in-picture — YouTube, Cloudflare Stream — showing
    // a control that silently does nothing.
    const sync = () =>
      set({
        isPictureInPicture: isPictureInPicture(media),
        pictureInPictureAvailability: supported
          ? isMediaSourceCapable(media) && hasMetadata(media)
            ? 'available'
            : 'unavailable'
          : 'unsupported',
      });

    sync();

    listen(media, 'enterpictureinpicture', sync, { signal });
    listen(media, 'leavepictureinpicture', sync, { signal });
    listen(media, 'loadstart', sync, { signal });
    listen(media, 'loadedmetadata', sync, { signal });
    listen(media, 'emptied', sync, { signal });

    // iOS Safari presentation mode change (covers PiP)
    const video = media as WebKitVideoElement;

    if ('webkitPresentationMode' in video) {
      listen(media, 'webkitpresentationmodechanged', sync, { signal });
    }
  },
});

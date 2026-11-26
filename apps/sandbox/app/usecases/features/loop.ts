import { definePlayerFeature } from '@videojs/core/dom';
import type { Media } from '@videojs/media';
import { listen } from '@videojs/utils/dom';
import { isBoolean } from '@videojs/utils/predicate';

/** A media that can wrap around at the end, the way `<video loop>` does. */
interface MediaLoopCapability extends Media {
  loop: boolean;
}

function isMediaLoopCapable(media: Media): media is MediaLoopCapability {
  return 'loop' in media && isBoolean(media.loop);
}

export interface LoopFeatureState {
  /** Whether playback wraps around at the end. */
  loop: boolean;
  setLoop(loop: boolean): void;
}

/**
 * Puts the media's `loop` in the store so a control can show and toggle it. The stock playback feature leaves loop to
 * the markup; a GIF viewer, a music player, or a background video all want a button for it.
 */
export const loopFeature = definePlayerFeature({
  name: 'loop',
  state: ({ target, set }): LoopFeatureState => ({
    loop: false,
    setLoop(loop) {
      const { media } = target();

      if (isMediaLoopCapable(media)) media.loop = loop;

      set({ loop });
    },
  }),

  attach({ target, signal, set }) {
    const { media } = target;
    if (!isMediaLoopCapable(media)) return;

    const sync = () => set({ loop: media.loop });

    sync();

    // Nothing announces a `loop` change on native media; a new source is the one moment markup can have changed it.
    listen(media, 'loadstart', sync, { signal });
  },
});

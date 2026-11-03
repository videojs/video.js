import type { MediaErrorState } from '@videojs/media';
import { isMediaErrorCapable } from '@videojs/media';
import { listen } from '@videojs/utils/events';

import { definePlayerFeature } from '../../feature';

export const errorFeature = definePlayerFeature({
  name: 'error',
  state: ({ set }): MediaErrorState => ({
    error: null,
    dismissError() {
      set({ error: null });
    },
  }),

  attach({ target, signal, set }) {
    const { media } = target;
    if (!isMediaErrorCapable(media)) return;

    const syncError = () => set({ error: media.error });

    listen(media, 'error', syncError, { signal });

    // Reset error state when a new source is loaded.
    listen(media, 'emptied', () => set({ error: null }), { signal });
  },
});

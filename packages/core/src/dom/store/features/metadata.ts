import type { MediaContentValue, MediaMetadataState } from '@videojs/media';
import { isMediaContentDataCapable } from '@videojs/media';
import { listen } from '@videojs/utils/dom';

import { definePlayerFeature } from '../../feature';
import type { PlayerFeatureConfig } from '../../player';

const MEDIA_TITLE = Symbol('@videojs/media-title');
const USER_TITLE = Symbol('@videojs/user-title');
const SET_USER_TITLE = Symbol('@videojs/set-user-title');
const DEFAULT_TITLE = '';

const MEDIA_POSTER = Symbol('@videojs/media-poster');
const USER_POSTER = Symbol('@videojs/user-poster');
const SET_USER_POSTER = Symbol('@videojs/set-user-poster');
const DEFAULT_POSTER = '';

interface MetadataSourceState extends Omit<MediaMetadataState, 'title' | 'poster'> {
  [MEDIA_TITLE]: MediaContentValue;
  [USER_TITLE]: MediaContentValue;
  [SET_USER_TITLE](value: MediaContentValue): void;
  [MEDIA_POSTER]: MediaContentValue;
  [USER_POSTER]: MediaContentValue;
  [SET_USER_POSTER](value: MediaContentValue): void;
}

/**
 * Resolves content metadata into player state, preferring what the author set over what the media carries. Included in
 * the standard audio, video, and live presets.
 */
export const metadataFeature = definePlayerFeature({
  name: 'metadata',
  config: {
    /** The title to display. Takes precedence over the title the media carries. */
    title: {
      action: SET_USER_TITLE,
      state: USER_TITLE,
      // `title` already means the tooltip on an element, so the input takes
      // another name there.
      html: { attribute: 'content-title' },
    },
    /** The poster to display. Takes precedence over the poster the media carries. */
    poster: {
      action: SET_USER_POSTER,
      state: USER_POSTER,
    },
  } satisfies PlayerFeatureConfig<MetadataSourceState>,
  state: ({ set }): MetadataSourceState => ({
    [MEDIA_TITLE]: undefined,
    [USER_TITLE]: undefined,
    [SET_USER_TITLE]: (value) => set({ [USER_TITLE]: value }),
    [MEDIA_POSTER]: undefined,
    [USER_POSTER]: undefined,
    [SET_USER_POSTER]: (value) => set({ [USER_POSTER]: value }),
  }),
  derived: {
    /** The resolved content title. Set it through the player, not through the store. */
    title: ({ get }): string => get()[USER_TITLE] ?? get()[MEDIA_TITLE] ?? DEFAULT_TITLE,
    /**
     * The resolved poster URL, independent of the media element's own `poster`. Set it through the player, not through
     * the store.
     */
    poster: ({ get }): string => get()[USER_POSTER] ?? get()[MEDIA_POSTER] ?? DEFAULT_POSTER,
  },
  attach({ target, signal, set }) {
    const { media } = target;

    const sync = () => {
      const contentData = isMediaContentDataCapable(media) ? media.contentData : undefined;

      set({
        [MEDIA_TITLE]: contentData?.title,
        [MEDIA_POSTER]: contentData?.poster,
      });
    };

    const bind = () => {
      sync();

      if (!isMediaContentDataCapable(media)) return;

      listen(media, 'contentdatachange', sync, { signal });
    };

    bind();

    // An adapter can receive its target after the store attaches.
    listen(media, 'loadstart', bind, { signal });
  },
});

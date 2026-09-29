import type { MediaFeatureAvailability, MediaVolumeState } from '@videojs/media';
import { isMediaMutedCapable, isMediaVolumeCapable } from '@videojs/media';
import { listen } from '@videojs/utils/dom';

import { definePlayerFeature } from '../../feature';

/** Volume to restore when unmuting at zero. */
const UNMUTE_VOLUME = 0.25;

export const volumeFeature = definePlayerFeature({
  name: 'volume',
  state: ({ target, set }): MediaVolumeState => ({
    volume: 1,
    muted: false,
    volumeAvailability: 'unavailable',
    mutedAvailability: 'unavailable',

    setVolume(volume: number) {
      const { media } = target();
      if (!isMediaVolumeCapable(media)) return 0;

      const clamped = Math.max(0, Math.min(1, volume));

      if (clamped > 0 && media.muted) {
        media.muted = false;
      }

      media.volume = clamped;

      // `volumechange` can be asynchronous. Sync immediately so controlled sliders do not render a stale value
      // between keyboard repeats.
      set({ volume: media.volume, muted: media.muted });

      return media.volume;
    },

    setMuted(muted: boolean) {
      const { media } = target();
      if (!isMediaMutedCapable(media)) return false;

      media.muted = muted;

      // Unmuting at zero would stay silent. A media that reports no level has
      // nothing to restore.
      const volumeCapable = isMediaVolumeCapable(media);

      if (!muted && volumeCapable && media.volume === 0) {
        media.volume = UNMUTE_VOLUME;
      }

      // `volumechange` is queued, so sync now, or an immediate second toggle would read the old value.
      set({ volume: volumeCapable ? media.volume : 1, muted: media.muted });

      return media.muted;
    },
  }),

  attach({ target, signal, set }) {
    const { media } = target;

    const volumeCapable = isMediaVolumeCapable(media);
    const mutedCapable = isMediaMutedCapable(media);
    // The two come apart, so either one alone is worth attaching for: a media
    // that mutes but sets no level still drives a mute button.
    if (!volumeCapable && !mutedCapable) return;

    set({
      volumeAvailability: volumeCapable ? canSetVolume() : 'unavailable',
      mutedAvailability: mutedCapable ? 'available' : 'unavailable',
    });

    const sync = () =>
      set({
        volume: volumeCapable ? media.volume : 1,
        muted: mutedCapable ? media.muted : false,
      });

    sync();

    listen(media, 'volumechange', sync, { signal });
  },
});

/** Check if volume can be programmatically set (fails on iOS Safari). */
function canSetVolume(): MediaFeatureAvailability {
  const video = document.createElement('video');

  try {
    video.volume = 0.5;
    return video.volume === 0.5 ? 'available' : 'unsupported';
  } catch {
    return 'unsupported';
  }
}

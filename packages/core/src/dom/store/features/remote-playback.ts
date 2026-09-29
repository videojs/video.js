import type { MediaRemotePlaybackState, RemotePlaybackConnectionState } from '@videojs/media';
import { isMediaRemotePlaybackCapable } from '@videojs/media';
import { isWebKitAirPlayCapable, listen, type WebkitAvailabilityEvent } from '@videojs/utils/dom';

import { definePlayerFeature } from '../../feature';
import { exitFullscreen, isFullscreen } from '../../presentation/fullscreen';
import { isRemotePlaybackConnected, requestRemotePlayback } from '../../presentation/remote-playback';

export const remotePlaybackFeature = definePlayerFeature({
  name: 'remotePlayback',
  state: ({ target }): MediaRemotePlaybackState => ({
    remotePlaybackState: 'disconnected',
    remotePlaybackAvailability: 'unsupported',

    async promptRemotePlayback() {
      const { media, container } = target();
      if (isRemotePlaybackConnected(media)) return requestRemotePlayback(media);

      if (isFullscreen(container, media)) {
        await exitFullscreen(media);
      }

      return await requestRemotePlayback(media);
    },
  }),

  attach({ target, signal, set }) {
    const { media } = target;
    if (!isMediaRemotePlaybackCapable(media)) return;

    // Safari's W3C `media.remote` events don't fire reliably for AirPlay
    // session changes. When WebKit's AirPlay APIs are available, drive both
    // state slices off the WebKit events and skip the W3C listeners entirely
    // so the two paths can't double-write or conflict.
    if (isWebKitAirPlayCapable(media)) {
      const syncConnection = () => {
        set({
          remotePlaybackState: media.webkitCurrentPlaybackTargetIsWireless ? 'connected' : 'disconnected',
        });
      };

      const syncAvailability = (event: Event) => {
        const { availability } = event as WebkitAvailabilityEvent;

        set({ remotePlaybackAvailability: availability === 'available' ? 'available' : 'unavailable' });
      };

      listen(media, 'webkitplaybacktargetavailabilitychanged', syncAvailability, { signal });
      listen(media, 'webkitcurrentplaybacktargetiswirelesschanged', syncConnection, { signal });

      // Sync initial connection state in case AirPlay was already active.
      syncConnection();
      return;
    }

    // W3C Remote Playback path (Chromium / Edge with the cast extension).
    const syncState = () => set({ remotePlaybackState: media.remote.state as RemotePlaybackConnectionState });

    syncState();

    listen(media.remote, 'connect', syncState, { signal });
    listen(media.remote, 'connecting', syncState, { signal });
    listen(media.remote, 'disconnect', syncState, { signal });

    media.remote
      .watchAvailability((available: boolean) => {
        set({ remotePlaybackAvailability: available ? 'available' : 'unavailable' });
      })
      .catch(() => {
        set({ remotePlaybackAvailability: 'unsupported' });
      });

    signal.addEventListener('abort', () => {
      media.remote?.cancelWatchAvailability?.().catch(() => {});
    });
  },
});

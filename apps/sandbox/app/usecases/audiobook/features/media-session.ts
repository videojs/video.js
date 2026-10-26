import { definePlayerFeature } from '@videojs/core/dom';
import {
  isMediaPauseCapable,
  isMediaPlaybackRateCapable,
  isMediaSeekCapable,
  type MediaFeatureAvailability,
} from '@videojs/media';
import { listen } from '@videojs/utils/dom';
import { isFunction, isNumber } from '@videojs/utils/predicate';

export interface SessionArtwork {
  src: string;
  sizes?: string;
  type?: string;
}

/** What the lock screen and the hardware keys show. The same shape as `MediaMetadata`, without the class. */
export interface SessionMetadata {
  title?: string;
  artist?: string;
  album?: string;
  artwork?: readonly SessionArtwork[];
}

export interface MediaSessionState {
  sessionMetadata: SessionMetadata | null;
  setSessionMetadata(metadata: SessionMetadata | null): void;
  /** `unsupported` where there is no Media Session API, which includes every server. */
  sessionAvailability: MediaFeatureAvailability;
}

/** What the hardware keys skip by when the platform gives no offset of its own. */
const SEEK_OFFSET = 15;
/** How often the position reaches the platform while playing. */
const POSITION_INTERVAL = 1000;

/**
 * Hands playback to the platform: lock-screen artwork, hardware play and skip keys, the position on the notification
 * scrubber. The media only needs pause and seek, so any adapter qualifies. Nothing here is audio-specific either; a
 * video player wants the same keys to work.
 */
export const mediaSessionFeature = definePlayerFeature({
  name: 'mediaSession',
  state: ({ set }): MediaSessionState => ({
    sessionMetadata: null,
    setSessionMetadata: (metadata) => set({ sessionMetadata: metadata }),
    sessionAvailability: 'unavailable',
  }),

  attach({ target, signal, set, get, store }) {
    const { media } = target;
    const session = globalThis.navigator?.mediaSession;

    if (!session || !isMediaPauseCapable(media) || !isMediaSeekCapable(media)) {
      set({ sessionAvailability: 'unsupported' });
      return;
    }

    set({ sessionAvailability: 'available' });

    let applied: SessionMetadata | null | undefined;
    let lastPositionAt = 0;

    const applyMetadata = () => {
      const metadata = get().sessionMetadata;
      if (metadata === applied) return;

      applied = metadata;

      try {
        session.metadata =
          metadata && isFunction(globalThis.MediaMetadata)
            ? new MediaMetadata({ ...metadata, artwork: metadata.artwork ? [...metadata.artwork] : [] })
            : null;
      } catch {
        // A rejected artwork entry is not worth losing the keys over.
      }
    };

    const applyPosition = () => {
      lastPositionAt = Date.now();

      if (!isFunction(session.setPositionState) || !Number.isFinite(media.duration)) return;

      try {
        session.setPositionState({
          duration: media.duration,
          playbackRate: isMediaPlaybackRateCapable(media) ? media.playbackRate : 1,
          position: Math.min(media.currentTime, media.duration),
        });
      } catch {
        // Out-of-range values throw; the next event will carry sane ones.
      }
    };

    const applyPlaybackState = () => {
      session.playbackState = media.paused ? 'paused' : 'playing';
      applyPosition();
    };

    const seekBy = (offset: number) => {
      media.currentTime = Math.max(0, Math.min(media.currentTime + offset, media.duration || Infinity));
    };

    const handlers = {
      play: () => void media.play(),
      pause: () => media.pause(),
      stop: () => media.pause(),
      seekbackward: (details) => seekBy(-(details.seekOffset ?? SEEK_OFFSET)),
      seekforward: (details) => seekBy(details.seekOffset ?? SEEK_OFFSET),
      seekto: (details) => {
        if (isNumber(details.seekTime)) media.currentTime = details.seekTime;
      },
    } satisfies Partial<Record<MediaSessionAction, MediaSessionActionHandler>>;

    const setHandlers = (on: boolean) => {
      for (const [action, handler] of Object.entries(handlers)) {
        try {
          // SAFETY: `handlers` is keyed by `MediaSessionAction`; `Object.entries` loses that.
          session.setActionHandler(action as MediaSessionAction, on ? handler : null);
        } catch {
          // An action the platform does not know throws; the rest still register.
        }
      }
    };

    setHandlers(true);
    applyMetadata();
    applyPlaybackState();

    listen(media, 'play', applyPlaybackState, { signal });
    listen(media, 'pause', applyPlaybackState, { signal });
    listen(media, 'ended', applyPlaybackState, { signal });
    listen(media, 'seeked', applyPosition, { signal });
    listen(media, 'ratechange', applyPosition, { signal });
    listen(media, 'durationchange', applyPosition, { signal });
    listen(media, 'loadedmetadata', applyPosition, { signal });
    listen(
      media,
      'timeupdate',
      () => {
        if (Date.now() - lastPositionAt >= POSITION_INTERVAL) applyPosition();
      },
      { signal }
    );

    const unsubscribe = store.subscribe(applyMetadata);

    signal.addEventListener(
      'abort',
      () => {
        unsubscribe();
        setHandlers(false);
        session.playbackState = 'none';
        session.metadata = null;
      },
      { once: true }
    );
  },
});

import { definePlayerFeature } from '@videojs/core/dom';
import type { Media, MediaFeatureAvailability } from '@videojs/media';
import { listen } from '@videojs/utils/dom';
import { isFunction, isNumber } from '@videojs/utils/predicate';

/**
 * A media whose timeline is a sequence of discrete frames it can address by index: a GIF, an image sequence, a dataset
 * sampled over time. `framechange` fires whenever `currentFrame` changes.
 */
export interface MediaFrameCapability extends Media {
  readonly frameCount: number;
  readonly currentFrame: number;
  readonly paused: boolean;
  seekToFrame(index: number): void;
  pause(): void;
}

export function isMediaFrameCapable(media: Media): media is MediaFrameCapability {
  return (
    'frameCount' in media &&
    isNumber(media.frameCount) &&
    'currentFrame' in media &&
    isNumber(media.currentFrame) &&
    'seekToFrame' in media &&
    isFunction(media.seekToFrame)
  );
}

export interface FrameFeatureState {
  /** How many frames the media has, 0 before it has loaded or when it has no frames to address. */
  frameCount: number;
  /** The frame on screen, 0-based. */
  currentFrame: number;
  /** Whether the media can be addressed by frame at all. */
  frameAvailability: MediaFeatureAvailability;
  /** Pause and show frame `index`, clamped to the frames the media has. */
  seekToFrame(index: number): void;
  /** Pause and move `delta` frames, clamped to the frames the media has. */
  stepFrame(delta: number): void;
}

/**
 * Frame-level position for media that address time by frame. Stepping pauses first, since a frame is a place to stand,
 * not a place to pass through; the stock time feature keeps handling continuous seeks.
 */
export const frameFeature = definePlayerFeature({
  name: 'frame',
  state: ({ target, set }): FrameFeatureState => ({
    frameCount: 0,
    currentFrame: 0,
    frameAvailability: 'unavailable',
    seekToFrame(index) {
      const { media } = target();
      if (!isMediaFrameCapable(media) || media.frameCount === 0) return;

      media.pause();
      media.seekToFrame(index);
      set({ currentFrame: media.currentFrame });
    },
    stepFrame(delta) {
      const { media } = target();
      if (!isMediaFrameCapable(media) || media.frameCount === 0) return;

      media.pause();
      media.seekToFrame(media.currentFrame + delta);
      set({ currentFrame: media.currentFrame });
    },
  }),

  attach({ target, signal, set }) {
    const { media } = target;

    if (!isMediaFrameCapable(media)) {
      set({ frameCount: 0, currentFrame: 0, frameAvailability: 'unsupported' });
      return;
    }

    const sync = () =>
      set({ frameCount: media.frameCount, currentFrame: media.currentFrame, frameAvailability: 'available' });

    sync();

    listen(media, 'loadedmetadata', sync, { signal });
    listen(media, 'emptied', sync, { signal });
    listen(media, 'framechange', sync, { signal });
  },
});

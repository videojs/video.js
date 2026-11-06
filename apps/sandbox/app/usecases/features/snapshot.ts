import { definePlayerFeature } from '@videojs/core/dom';
import type { Media, MediaFeatureAvailability } from '@videojs/media';
import { listen } from '@videojs/utils/dom';
import { isFunction } from '@videojs/utils/predicate';

/** Anything the current picture can be read back from: a canvas the media paints, or a `<video>` frame. */
type SnapshotSurface = HTMLCanvasElement | HTMLVideoElement;

/** An adapter that paints into an element it exposes as `target`. */
interface PaintingMedia extends Media {
  readonly target: EventTarget | null;
}

function hasPaintTarget(media: Media): media is PaintingMedia {
  return 'target' in media && (media.target === null || media.target instanceof EventTarget);
}

/** A canvas, or a stand-in that can encode itself: `toBlob` is the only canvas member the snapshot reads. */
function isCanvasLike(target: EventTarget | null): target is HTMLCanvasElement {
  return target !== null && 'toBlob' in target && isFunction(target.toBlob);
}

function isVideo(target: EventTarget | null): target is HTMLVideoElement {
  return 'HTMLVideoElement' in globalThis && target instanceof HTMLVideoElement;
}

/** The media itself when it is a `<video>`, otherwise whatever element an adapter paints into. */
function surfaceOf(media: Media): SnapshotSurface | null {
  if (isVideo(media)) return media;

  if (!hasPaintTarget(media)) return null;

  const { target } = media;
  if (isCanvasLike(target) || isVideo(target)) return target;

  return null;
}

/** Encode the picture on screen as PNG, or `null` where it cannot be read back (no DOM, tainted, or not ready). */
async function toPng(surface: SnapshotSurface): Promise<Blob | null> {
  let canvas: HTMLCanvasElement;

  if (isVideo(surface)) {
    if (!('document' in globalThis) || surface.videoWidth === 0) return null;

    canvas = document.createElement('canvas');
    canvas.width = surface.videoWidth;
    canvas.height = surface.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(surface, 0, 0);
  } else {
    canvas = surface;
  }

  try {
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  } catch {
    // A tainted canvas refuses to export.
    return null;
  }
}

export interface SnapshotFeatureState {
  /** Whether the picture on screen can be read back at all. */
  snapshotAvailability: MediaFeatureAvailability;
  /** Copy the picture on screen to the clipboard as a PNG. Resolves `false` when nothing could be copied. */
  copySnapshot(): Promise<boolean>;
}

/** Read back the picture on screen. Works for a `<video>` and for any adapter that paints into a canvas. */
export const snapshotFeature = definePlayerFeature({
  name: 'snapshot',
  state: ({ target }): SnapshotFeatureState => ({
    snapshotAvailability: 'unavailable',
    async copySnapshot() {
      const surface = surfaceOf(target().media);
      if (!surface) return false;

      const clipboard = globalThis.navigator?.clipboard;
      if (!clipboard || !('write' in clipboard) || !('ClipboardItem' in globalThis)) return false;

      const blob = await toPng(surface);
      if (!blob) return false;

      try {
        await clipboard.write([new ClipboardItem({ [blob.type]: blob })]);

        return true;
      } catch {
        return false;
      }
    },
  }),

  attach({ target, signal, set }) {
    const { media } = target;
    const sync = () => set({ snapshotAvailability: surfaceOf(media) ? 'available' : 'unsupported' });

    sync();

    // An adapter can receive its paint target after the store attaches.
    listen(media, 'loadstart', sync, { signal });
  },
});

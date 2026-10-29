import type { MediaTextCue } from '@videojs/media';

import { toMediaTextCues } from './text-cues';

/**
 * Parse WebVTT with the browser's own parser, through a `<track>` on a video that's never shown. Loaded on demand, so
 * players that never read a VTT file don't carry it.
 */
export function parseVtt(text: string, kind: string, signal?: AbortSignal): Promise<MediaTextCue[]> {
  if (signal?.aborted) return Promise.reject(signal.reason);

  const video = document.createElement('video');
  const track = document.createElement('track');
  // The text was already fetched, so the track reads it from a same-origin blob and needs no CORS.
  const url = URL.createObjectURL(new Blob([text], { type: 'text/vtt' }));

  video.muted = true;
  video.preload = 'none';
  track.kind = 'metadata';

  return new Promise((resolve, reject) => {
    const cleanup = new AbortController();

    const settle = () => {
      cleanup.abort();
      URL.revokeObjectURL(url);
      track.remove();
    };

    signal?.addEventListener(
      'abort',
      () => {
        settle();
        reject(signal.reason);
      },
      { once: true, signal: cleanup.signal }
    );

    track.addEventListener(
      'load',
      () => {
        const cues = toMediaTextCues(track.track.cues, { kind });

        settle();
        resolve(cues);
      },
      { once: true }
    );
    track.addEventListener(
      'error',
      () => {
        settle();
        reject(new Error('[vjs-core] could not parse a WebVTT text track'));
      },
      { once: true }
    );

    video.append(track);
    // A track only loads once it's active; `hidden` loads it without drawing anything.
    track.track.mode = 'hidden';
    track.src = url;
  });
}

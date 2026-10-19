'use client';

import { type MediaStreamType, MediaStreamTypes } from '@videojs/media';
import type { MuxContentData } from '@videojs/mux-video';
import { useSyncExternalStore } from '@videojs/store/react';
import { useCallback } from 'react';

/**
 * What the storyboard track needs from whichever Mux Media renders it.
 *
 * Structural on purpose: the hls.js-backed `MuxVideoAdapter` and the SPF-backed one satisfy it identically, so this
 * component carries no engine.
 */
export interface MuxStoryboardMedia {
  readonly streamType: MediaStreamType | undefined;
  readonly contentData: MuxContentData;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

/** Renders the storyboard track in its own component so media changes don't re-render the whole media component. */
export function MuxStoryboard({ media }: { media: MuxStoryboardMedia }) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      // `useSyncProps` writes `src` / `source` during render and those setters
      // dispatch `sourcechange` synchronously. Defer (and coalesce) notifications
      // so we never schedule an update while another component is rendering.
      let cancelled = false;
      let scheduled = false;
      const notify = () => {
        if (scheduled) return;

        scheduled = true;
        queueMicrotask(() => {
          scheduled = false;

          if (!cancelled) onChange();
        });
      };

      media.addEventListener('streamtypechange', notify);
      media.addEventListener('sourcechange', notify);
      return () => {
        cancelled = true;
        media.removeEventListener('streamtypechange', notify);
        media.removeEventListener('sourcechange', notify);
      };
    },
    [media]
  );

  // The stream type is detected at runtime and live streams have no storyboard.
  // The '' fallback keeps the snapshot a string rather than sometimes undefined.
  const getSnapshot = () => (media.streamType === MediaStreamTypes.LIVE ? '' : (media.contentData.storyboard ?? ''));
  const src = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  if (!src) return null;

  return <track kind="metadata" label="thumbnails" src={src} default />;
}

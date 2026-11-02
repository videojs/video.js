import type { MediaControlsState } from '@videojs/react';
import { HlsVideo, type HlsVideoProps } from '@videojs/react/media/hls-video';
import { forwardRef, useEffect } from 'react';

import chapters from '@/assets/blog/2026-10-08-videojs-v10-skin-design/cosmic-dawn-chapters.vtt?url';

const playbackId = '83EzHOvVzVN01AsrD01BCpiH02Pj3S8mfzBOu101w2nHC5s';

/** NASA's Cosmic Dawn trailer with chapters and storyboard thumbnails, shared by the skin demos. */
export const CosmicDawnVideo = forwardRef<HTMLVideoElement, Omit<HlsVideoProps, 'src' | 'poster' | 'children'>>(
  function CosmicDawnVideo(props, ref) {
    return (
      <HlsVideo
        ref={ref}
        src={`https://stream.mux.com/${playbackId}.m3u8`}
        poster={`https://image.mux.com/${playbackId}/thumbnail.webp?time=69`}
        preload="metadata"
        muted
        playsInline
        crossOrigin="anonymous"
        {...props}
      >
        <track kind="chapters" label="English" srcLang="en" src={chapters} default />
        <track kind="metadata" label="thumbnails" src={`https://image.mux.com/${playbackId}/storyboard.vtt`} default />
      </HlsVideo>
    );
  }
);

/** Keep a demo player's controls visible, waiting a frame so the lock lands after its media attaches. */
export function useControlsLock(
  requestControlsLock: MediaControlsState['requestControlsLock'] | undefined,
  media?: HTMLMediaElement | null
) {
  useEffect(() => {
    let release: (() => void) | undefined;
    const frame = requestAnimationFrame(() => {
      release = requestControlsLock?.();
    });

    return () => {
      cancelAnimationFrame(frame);
      release?.();
    };
  }, [media, requestControlsLock]);
}

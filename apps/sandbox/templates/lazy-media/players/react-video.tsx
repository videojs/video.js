// The player, skin, and `LazyVideo`, split out so light mode loads none of them until play is pressed.
import '@videojs/react/video/skin.css';
import { LazyVideo } from '@videojs/react/media/lazy-video';
import { usePlayer, VideoPlayer, VideoSkin } from '@videojs/react/video';

import { createReactMount, type LazyReactPlayerProps, useReportStarted } from './react';

function StartedReporter({ onStarted }: { onStarted: () => void }) {
  useReportStarted(
    usePlayer((state) => state.started),
    onStarted
  );

  return null;
}

function LazyVideoPlayer({ src, poster, autoplay, muted, preload, mediaRef, onStarted }: LazyReactPlayerProps) {
  return (
    <VideoPlayer poster={poster}>
      <VideoSkin className="sandbox-video-frame">
        <LazyVideo
          src={src}
          mediaRef={mediaRef}
          autoPlay={autoplay}
          muted={muted}
          preload={preload === 'none' ? undefined : preload}
          playsInline
          crossOrigin=""
        />
      </VideoSkin>
      <StartedReporter onStarted={onStarted} />
    </VideoPlayer>
  );
}

export const mount = createReactMount(LazyVideoPlayer);

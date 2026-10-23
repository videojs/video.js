// The player, skin, and `LazyVideo`, split out so light mode loads none of them until play is pressed.
import '@videojs/react/video/skin.css';
import type { Media } from '@videojs/media';
import { LazyVideo } from '@videojs/react/media/lazy-video';
import { usePlayer, VideoPlayer, VideoSkin } from '@videojs/react/video';
import { useEffect } from 'react';

export interface LazyPlayerProps {
  src: string;
  poster: string | undefined;
  /** Light mode: autoplay once loaded, and report when playback starts. */
  light: boolean;
  onMedia: (media: Media | null) => void;
  onStarted: () => void;
}

// Inside the player, so it can read whether playback started.
function StartedReporter({ onStarted }: { onStarted: () => void }) {
  const started = usePlayer((state) => state.started);

  useEffect(() => {
    if (started) onStarted();
  }, [started, onStarted]);

  return null;
}

export default function LazyPlayer({ src, poster, light, onMedia, onStarted }: LazyPlayerProps) {
  return (
    <VideoPlayer poster={poster}>
      <VideoSkin className="sandbox-video-frame">
        {/* After the click in light mode, `preload="auto"`: hls.js doesn't let `autoplay` override `preload="none"`. */}
        <LazyVideo
          src={src}
          mediaRef={onMedia}
          autoPlay={light}
          preload={light ? 'auto' : undefined}
          playsInline
          crossOrigin=""
        />
      </VideoSkin>
      {light && <StartedReporter onStarted={onStarted} />}
    </VideoPlayer>
  );
}

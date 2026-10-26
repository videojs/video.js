// The player, skin, and `LazyVideo`, split out so light mode loads none of them until play is pressed.
import '@videojs/react/video/skin.css';
import type { Media } from '@videojs/media';
import { getMediaEngineName } from '@videojs/media/dom';
import { LazyVideo } from '@videojs/react/media/lazy-video';
import { usePlayer, VideoPlayer, VideoSkin } from '@videojs/react/video';
import { useCallback, useEffect } from 'react';

export interface LazyPlayerProps {
  src: string;
  poster: string | undefined;
  /** Light mode: autoplay once loaded, and report when playback starts. */
  light: boolean;
  /** Receives a description of the resolved media, or `null` while there's none. */
  onResolved: (description: string | null) => void;
  onStarted: () => void;
}

// A native `<video>` plays itself; anything else is an adapter, named by its engine because class names are minified in
// production builds. Some adapters, such as hls.js's, only pick their engine once playback starts under
// `preload="none"`.
function describeMedia(media: Media, started: boolean): string {
  if (media instanceof HTMLElement) return `<${media.localName}>`;

  const engine = getMediaEngineName(media);
  if (engine) return `${engine} adapter`;

  return started ? 'adapter' : 'adapter, engine picked on play';
}

// Inside the player, so it can read whether playback started.
function StartedReporter({ onStarted }: { onStarted: () => void }) {
  const started = usePlayer((state) => state.started);

  useEffect(() => {
    if (started) onStarted();
  }, [started, onStarted]);

  return null;
}

export default function LazyPlayer({ src, poster, light, onResolved, onStarted }: LazyPlayerProps) {
  const mediaRef = useCallback(
    (media: Media | null) => {
      if (!media) return;

      const update = () => onResolved(describeMedia(media, true));

      onResolved(describeMedia(media, false));
      media.addEventListener('playing', update);

      return () => {
        media.removeEventListener('playing', update);
        onResolved(null);
      };
    },
    [onResolved]
  );

  return (
    <VideoPlayer poster={poster}>
      <VideoSkin className="sandbox-video-frame">
        <LazyVideo src={src} mediaRef={mediaRef} autoPlay={light} playsInline crossOrigin="" />
      </VideoSkin>
      {light && <StartedReporter onStarted={onStarted} />}
    </VideoPlayer>
  );
}

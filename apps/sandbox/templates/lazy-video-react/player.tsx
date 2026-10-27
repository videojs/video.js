// The player, skin, and `LazyVideo`, split out so light mode loads none of them until play is pressed.
import '@videojs/react/video/skin.css';
import { type LazyPreload, observeEmbedFetching } from '@app/shared/lazy-sources';
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
  /** Autoplay once loaded, outside light mode too. */
  autoplay: boolean;
  /** Start muted, which browsers require before most autoplay. */
  muted: boolean;
  /** `none` is left off, so the page shows what `LazyVideo` does by default. */
  preload: LazyPreload;
  /** Receives a description of the resolved media, or `null` while there's none. */
  onResolved: (description: string | null) => void;
  /** Receives whether the resolved media's embed has started downloading from its service. */
  onEmbedFetching: (fetching: boolean) => void;
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

// An embed adapter is attached to its frame before the media ref is handed out.
function frameOf(media: Media): HTMLIFrameElement | null {
  return 'target' in media && media.target instanceof HTMLIFrameElement ? media.target : null;
}

export default function LazyPlayer({
  src,
  poster,
  light,
  autoplay,
  muted,
  preload,
  onResolved,
  onEmbedFetching,
  onStarted,
}: LazyPlayerProps) {
  const mediaRef = useCallback(
    (media: Media | null) => {
      if (!media) return;

      const update = () => onResolved(describeMedia(media, true));
      const stopEmbedObserver = observeEmbedFetching(frameOf(media), onEmbedFetching);

      onResolved(describeMedia(media, false));
      media.addEventListener('playing', update);

      return () => {
        media.removeEventListener('playing', update);
        stopEmbedObserver();
        onEmbedFetching(false);
        onResolved(null);
      };
    },
    [onResolved, onEmbedFetching]
  );

  return (
    <VideoPlayer poster={poster}>
      <VideoSkin className="sandbox-video-frame">
        <LazyVideo
          src={src}
          mediaRef={mediaRef}
          autoPlay={light || autoplay}
          muted={muted}
          preload={preload === 'none' ? undefined : preload}
          playsInline
          crossOrigin=""
        />
      </VideoSkin>
      {light && <StartedReporter onStarted={onStarted} />}
    </VideoPlayer>
  );
}

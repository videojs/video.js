import { type LazyPlayerOptions, type MountLazyPlayer, observeEmbedFetching } from '@app/shared/lazy-sources';
import type { Media } from '@videojs/media';
import { getMediaEngineName } from '@videojs/media/dom';
import { type ComponentType, useCallback, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

/** What a React lazy media player renders from: the mount options, with the media reported through `mediaRef`. */
export interface LazyReactPlayerProps extends Omit<LazyPlayerOptions, 'onResolved' | 'onEmbedFetching'> {
  mediaRef: (media: Media | null) => void | (() => void);
}

// A native `<video>` or `<audio>` plays itself; anything else is an adapter, named by its engine because class names
// are minified in production builds. Some adapters, such as hls.js's, only pick their engine once playback starts under
// `preload="none"`.
function describeMedia(media: Media, started: boolean): string {
  if (media instanceof HTMLElement) return `<${media.localName}>`;

  const engine = getMediaEngineName(media);
  if (engine) return `${engine} adapter`;

  return started ? 'adapter' : 'adapter, engine picked on play';
}

// An embed adapter is attached to its frame before the media ref is handed out.
function frameOf(media: Media): HTMLIFrameElement | null {
  return 'target' in media && media.target instanceof HTMLIFrameElement ? media.target : null;
}

/** Calls `onStarted` once playback starts; render it inside the player so it can read the player's state. */
export function useReportStarted(started: boolean, onStarted: () => void) {
  useEffect(() => {
    if (started) onStarted();
  }, [started, onStarted]);
}

function LazyRoot({
  Player,
  onResolved,
  onEmbedFetching,
  ...props
}: LazyPlayerOptions & { Player: ComponentType<LazyReactPlayerProps> }) {
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

  return <Player {...props} mediaRef={mediaRef} />;
}

/** A mount that renders `Player` into the stage with its own React root. */
export function createReactMount(Player: ComponentType<LazyReactPlayerProps>): MountLazyPlayer {
  return (stage, options) => {
    let props = options;

    stage.replaceChildren();

    const root = createRoot(stage);
    const render = () => root.render(<LazyRoot {...props} Player={Player} />);

    render();

    return {
      setSource(src, poster) {
        props = { ...props, src, poster };
        render();
      },
      destroy() {
        root.unmount();
      },
    };
  };
}

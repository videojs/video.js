import '@videojs/html/video/player';
import '@videojs/html/video/skin';
import '@videojs/html/media/dash-video';
import '@videojs/html/media/hls-video';
import '@videojs/html/media/hlsjs-video';
import '@videojs/html/media/shaka-video';
import { DashVideo } from '@videojs/react/media/dash-video';
import { HlsVideo } from '@videojs/react/media/hls-video';
import { HlsJsVideo } from '@videojs/react/media/hlsjs-video';
import { ShakaVideo } from '@videojs/react/media/shaka-video';
import { VideoPlayer, VideoSkin } from '@videojs/react/video';

import '@videojs/react/video/skin.css';
import { StrictMode, useLayoutEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

/**
 * Drives one player through mount, unmount, reparent, and source changes from the test, all within one page load.
 * `?framework=html|react` picks the platform and `?media=` the engine. React renders under `StrictMode`, so every mount
 * also runs the development double mount/unmount against the real engine.
 */
export interface LifecycleHarness {
  /** Render a fresh player tree playing `src`. */
  mount(src: string): void;
  /** Remove the player tree. */
  unmount(): void;
  setSource(src: string): void;
  /** Synchronously move the mounted player to the other root. HTML only: React cannot reparent without remounting. */
  reparent(): void;
  /** The media element the player controls, if mounted. */
  media(): HTMLMediaElement | null;
}

declare global {
  interface Window {
    lifecycle: LifecycleHarness;
  }
}

const REACT_MEDIA = {
  'dash-video': DashVideo,
  'hls-video': HlsVideo,
  'hlsjs-video': HlsJsVideo,
  'shaka-video': ShakaVideo,
} as const;

type MediaTag = keyof typeof REACT_MEDIA;

function parseMediaTag(value: string | null): MediaTag {
  const tag = Object.keys(REACT_MEDIA).find((key): key is MediaTag => key === value);
  if (!tag) throw new Error(`Unknown media element: ${value}`);

  return tag;
}

const params = new URLSearchParams(location.search);
const tag = parseMediaTag(params.get('media'));

const root = document.getElementById('root')!;
const otherRoot = document.getElementById('other-root')!;

window.lifecycle = params.get('framework') === 'react' ? createReactHarness() : createHtmlHarness();

function createHtmlHarness(): LifecycleHarness {
  let player: HTMLElement | null = null;

  const media = () => player?.querySelector<HTMLMediaElement>(tag) ?? null;

  return {
    mount(src) {
      player?.remove();
      player = document.createElement('video-player');

      const skin = document.createElement('video-skin');
      const element = document.createElement(tag);

      skin.style.cssText = 'width: 640px; aspect-ratio: 16/9';
      element.setAttribute('playsinline', '');
      element.setAttribute('muted', '');
      element.setAttribute('crossorigin', 'anonymous');
      element.setAttribute('src', src);

      skin.append(element);
      player.append(skin);
      root.append(player);
    },
    unmount() {
      player?.remove();
      player = null;
    },
    setSource(src) {
      const element = media();

      if (element) element.src = src;
    },
    reparent() {
      if (player) (player.parentElement === root ? otherRoot : root).append(player);
    },
    media,
  };
}

function createReactHarness(): LifecycleHarness {
  const Media = REACT_MEDIA[tag];
  let update: (src: string | null) => void = () => {};

  function App() {
    const [src, setSrc] = useState<string | null>(null);

    // Layout effects run inside the synchronous initial render, so the harness can drive the app as soon as it exists.
    useLayoutEffect(() => {
      update = setSrc;
    }, []);

    if (src === null) return null;

    return (
      <VideoPlayer>
        <VideoSkin style={{ width: 640, aspectRatio: '16/9' }}>
          <Media src={src} playsInline muted crossOrigin="anonymous" />
        </VideoSkin>
      </VideoPlayer>
    );
  }

  // Render synchronously so `update` is bound before the first test call.
  flushSync(() =>
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>
    )
  );

  // Commit each change synchronously so back-to-back calls reach the engine as separate renders, not one batch.
  const commit = (src: string | null) => flushSync(() => update(src));

  return {
    mount: commit,
    unmount: () => commit(null),
    setSource: commit,
    reparent() {
      throw new Error('React cannot reparent a mounted tree');
    },
    media: () => root.querySelector('video'),
  };
}

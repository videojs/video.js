/// <reference types="vite/client" />

import '@videojs/html/video/player';
import '@videojs/html/video/skin';
import '@videojs/html/media/lazy-video';
import { LazyVideo } from '@videojs/react/media/lazy-video';
import { VideoPlayer, VideoSkin } from '@videojs/react/video';

import '@videojs/react/video/skin.css';
import { type CSSProperties, createElement, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { MEDIA } from './resources';

const SOURCES = {
  mp4: MEDIA.mp4.url,
  hls: MEDIA.hlsTs.url,
  dash: MEDIA.dash.url,
  youtube: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
};

type SourceKey = keyof typeof SOURCES;

declare global {
  interface Window {
    /** Every height the skin has had since it was added to the page, in order. */
    skinHeights: number[];
    setSource(key: SourceKey): void;
  }
}

const params = new URLSearchParams(location.search);
const html = params.get('framework') === 'html';
// `sized` gives the skin an aspect ratio, as the installation snippet does; `auto` leaves its height to the media.
const skinStyle: CSSProperties =
  params.get('layout') === 'auto' ? { display: 'block' } : { display: 'block', aspectRatio: '16 / 9' };
const stage = document.getElementById('stage')!;

window.skinHeights = [];
recordSkinHeights();

function App() {
  // SAFETY: the spec only opens the page with a `SOURCES` key.
  const [source, setSource] = useState((params.get('src') as SourceKey | null) ?? 'mp4');

  useEffect(() => {
    window.setSource = setSource;
  }, []);

  if (html) {
    return createElement(
      'video-player',
      null,
      createElement('video-skin', { style: skinStyle }, createElement('lazy-video', { src: SOURCES[source] }))
    );
  }

  return (
    <VideoPlayer>
      <VideoSkin style={skinStyle}>
        <LazyVideo src={SOURCES[source]} />
      </VideoSkin>
    </VideoPlayer>
  );
}

// Starts with the skin's first box, so the shell's first render is the baseline rather than the empty page before it.
function recordSkinHeights() {
  const observer = new MutationObserver(() => {
    const skin = stage.querySelector('video-skin, .media-skin');
    if (!skin) return;

    observer.disconnect();
    new ResizeObserver(() => window.skinHeights.push(Math.round(skin.getBoundingClientRect().height))).observe(skin);
  });

  observer.observe(stage, { childList: true, subtree: true });
}

createRoot(stage).render(<App />);

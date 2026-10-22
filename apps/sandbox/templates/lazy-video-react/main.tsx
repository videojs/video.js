import '@app/styles.css';
// <LazyVideo> resolves `src` to a media component and loads only that component's code.
// http://localhost:5173/lazy-video-react/
//
// Switch sources and watch the network panel: an MP4 loads no engine, and each other source loads one chunk.
import '@videojs/react/video/skin.css';
import { LAZY_VIDEO_SOURCES } from '@app/shared/lazy-sources';
import { LazyVideo } from '@videojs/react/media/lazy-video';
import { VideoPlayer, VideoSkin } from '@videojs/react/video';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  const [src, setSrc] = useState<string>(LAZY_VIDEO_SOURCES[0].src);

  return (
    <>
      <VideoPlayer>
        <VideoSkin className="sandbox-video-frame">
          <LazyVideo src={src} playsInline crossOrigin="" />
        </VideoSkin>
      </VideoPlayer>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Source">
        {LAZY_VIDEO_SOURCES.map(({ label, src: option }) => (
          <button
            key={option}
            type="button"
            className="rounded border px-3 py-1"
            aria-pressed={option === src}
            onClick={() => setSrc(option)}
          >
            {label}
          </button>
        ))}
      </div>
    </>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

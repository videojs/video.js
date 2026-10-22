import { LazyVideo } from '@videojs/react/media/lazy-video';
import { useState } from 'react';

import './BasicUsage.css';

const SOURCES = [
  { label: 'MP4', src: '{{VJS10_DEMO_VIDEO_MP4}}' },
  { label: 'HLS', src: '{{VJS10_DEMO_VIDEO_HLS}}' },
  { label: 'DASH', src: '{{VJS10_DEMO_DASH}}' },
  { label: 'YouTube', src: '{{VJS10_DEMO_YOUTUBE}}' },
];

export default function BasicUsage() {
  const [src, setSrc] = useState(SOURCES[0]!.src);

  return (
    <div className="react-lazy-video-basic">
      <LazyVideo className="react-lazy-video-basic__media" src={src} controls muted playsInline />
      <div className="react-lazy-video-basic__sources">
        {SOURCES.map((source) => (
          <button key={source.label} type="button" aria-pressed={source.src === src} onClick={() => setSrc(source.src)}>
            {source.label}
          </button>
        ))}
      </div>
    </div>
  );
}

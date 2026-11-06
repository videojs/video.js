import '@app/styles.css';
import { HyperFramesVideo } from '@videojs/react/media/hyperframes-video';

import '@videojs/react/video/skin.css';
// HyperFrames composition sandbox — React
// http://localhost:5173/hyperframes-video-react/
//
// The composition is the JSX children: clips timed with `data-start`/`data-duration`, rendered into the composition
// frame through a portal and animated by a GSAP timeline built from the composition root.
import { VideoPlayer, VideoSkin } from '@videojs/react/video';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';

// GSAP loads from the page's `<script>`; only the calls the timeline makes are typed.
interface GsapTimeline {
  from(target: Element | null, vars: object, position?: number): GsapTimeline;
  to(target: Element | null, vars: object, position?: number): GsapTimeline;
  duration(): number;
  seek(time: number): unknown;
  pause(): unknown;
}

declare const gsap: { timeline(): GsapTimeline };

const styles = `
  .stage { position: absolute; inset: 0; background: linear-gradient(135deg, #0f172a, #1e3a8a); }
  .title, .subtitle { position: absolute; left: 160px; margin: 0; font: 800 140px/1 system-ui, sans-serif; color: #fff; }
  .title { top: 320px; }
  .subtitle { top: 520px; font-size: 72px; font-weight: 500; color: #fbbf24; }
  .shape { position: absolute; right: 220px; top: 380px; width: 280px; height: 280px; border-radius: 48px; background: #f472b6; }
`;

function App() {
  const [name, setName] = useState('Video.js');

  return (
    <div className="mx-auto w-full max-w-4xl space-y-3">
      <VideoPlayer>
        <VideoSkin className="sandbox-video-frame block w-full" style={{ aspectRatio: '16 / 9' }}>
          <HyperFramesVideo
            className="block h-full w-full"
            timeline={(root) =>
              gsap
                .timeline()
                .from(root.querySelector('.title'), { y: 80, opacity: 0, duration: 1, ease: 'power3.out' }, 0)
                .from(root.querySelector('.subtitle'), { x: -120, opacity: 0, duration: 0.8, ease: 'power2.out' }, 1.5)
                .from(
                  root.querySelector('.shape'),
                  { scale: 0, rotation: -180, duration: 1.2, ease: 'back.out(1.7)' },
                  3
                )
                .to(root.querySelector('.shape'), { rotation: 180, duration: 3.8, ease: 'none' }, 4.2)
            }
          >
            <style>{styles}</style>
            <div className="stage" data-start="0" data-duration="8" data-track-index="0" />
            <h1 className="clip title" data-start="0" data-duration="5" data-track-index="1">
              Hello, {name}
            </h1>
            <p className="clip subtitle" data-start="1.5" data-duration="6.5" data-track-index="2">
              played by HyperFrames
            </p>
            <div className="clip shape" data-start="3" data-duration="5" data-track-index="3" />
          </HyperFramesVideo>
        </VideoSkin>
      </VideoPlayer>
      {/* Edits re-render the markup in place: the same composition keeps playing. */}
      <label className="flex items-center gap-2 text-sm">
        Name
        <input className="rounded border px-2 py-1" value={name} onChange={(event) => setName(event.target.value)} />
      </label>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

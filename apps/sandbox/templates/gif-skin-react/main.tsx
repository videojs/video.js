import '@app/styles.css';
// A skin built for GIFs — React
// http://localhost:5173/gif-skin-react/
//
// The stock video skin treats a GIF like a silent video. This one treats it
// like a GIF: first frame visible, tap anywhere to toggle, a frame counter and
// frame stepping, a loop toggle, speed, and "copy this frame". Autoplay waits
// when the viewer prefers reduced motion.
import { useReducedMotion } from '@app/shared/react/use-reduced-motion';
import { GifVideo } from '@app/usecases/gif-video/react';
import { GifPlayer, GifSkin } from '@app/usecases/gif-video/skin/react';
import { GIF_SOURCES } from '@app/usecases/gif-video/sources';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';

/** Autoplay follows the viewer's motion preference; the skin's caption explains the wait. */
function MotionAwareGif({ src }: { src: string }) {
  const reducedMotion = useReducedMotion();

  return <GifVideo className="block max-h-[70vh] w-full" src={src} autoplay={!reducedMotion} loop />;
}

function App() {
  const [source, setSource] = useState(GIF_SOURCES[0]!);

  return (
    <div className="flex w-full max-w-2xl flex-col items-stretch gap-4">
      <GifPlayer>
        <GifSkin className="w-full">
          <MotionAwareGif src={source.url} />
        </GifSkin>
      </GifPlayer>
      <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
        {GIF_SOURCES.map((candidate) => (
          <button
            key={candidate.url}
            type="button"
            className="rounded-full border px-3 py-1 aria-pressed:bg-neutral-900 aria-pressed:text-white dark:aria-pressed:bg-white dark:aria-pressed:text-black"
            aria-pressed={candidate.url === source.url}
            onClick={() => setSource(candidate)}
          >
            {candidate.label}
          </button>
        ))}
      </div>
      <p className="text-center text-sm opacity-70">
        Tap the GIF to pause it. Step frames while paused, drag the bar to scrub, copy the frame you land on.
      </p>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

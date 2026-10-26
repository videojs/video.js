import '@app/styles.css';
// A grid of GIFs that play on hover — React
// http://localhost:5173/gif-grid-react/
//
// A picker or a feed shows many GIFs at once; with <img> they all animate
// forever. Here each tile is its own small player that sits on its first
// frame and plays only while hovered or focused, then rewinds. The minimal
// skin keeps the tap gesture and the paused badge and drops the control bar.
import { useReducedMotion } from '@app/shared/react/use-reduced-motion';
import { GifVideo } from '@app/usecases/gif-video/react';
import { GifPlayer, GifSkin, useGifPlayer } from '@app/usecases/gif-video/skin/react';
import { GIF_SOURCES } from '@app/usecases/gif-video/sources';
import { createRoot } from 'react-dom/client';

function HoverToPlay({ children }: { children: React.ReactNode }) {
  // A wall of tiles animating under the cursor is what the motion preference exists to stop; a tap still plays.
  const reducedMotion = useReducedMotion();
  const play = useGifPlayer((state) => state.play);
  const seekToFrame = useGifPlayer((state) => state.seekToFrame);

  // Stepping pauses first, so this both stops the tile and puts it back on its first frame.
  const rewind = () => seekToFrame(0);

  return (
    <div
      className="contents"
      onPointerEnter={reducedMotion ? undefined : () => void play().catch(() => undefined)}
      onPointerLeave={rewind}
      onFocus={reducedMotion ? undefined : () => void play().catch(() => undefined)}
      onBlur={rewind}
    >
      {children}
    </div>
  );
}

const TILES = [...GIF_SOURCES, ...GIF_SOURCES].map((source, index) => ({ ...source, key: `${index}-${source.url}` }));

function App() {
  return (
    <div className="grid w-full max-w-4xl grid-cols-2 gap-3 md:grid-cols-4">
      {TILES.map((tile) => (
        <GifPlayer key={tile.key}>
          <HoverToPlay>
            <GifSkin minimal className="aspect-square">
              <GifVideo className="block h-full w-full object-cover" src={tile.url} loop preload="auto" />
            </GifSkin>
          </HoverToPlay>
        </GifPlayer>
      ))}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

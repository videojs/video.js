import '@app/styles.css';
// Animated GIF as a Video.js media — React
// http://localhost:5173/gif-video-react/
//
// React equivalent of gif-video-html: `<GifVideo>` renders a canvas and hands
// a `GifAdapter` to the player, so the stock video skin drives it.
import { VideoPlayer } from '@app/shared/react/players';
import { VideoSkinComponent } from '@app/shared/react/skins';
import { GifVideo } from '@app/usecases/gif-video/react';
import { GIF_VIDEO_SRC } from '@app/usecases/gif-video/sources';
import { createRoot } from 'react-dom/client';

function App() {
  return (
    <div className="flex flex-col items-center gap-6">
      <VideoPlayer>
        <VideoSkinComponent>
          <GifVideo className="block h-full w-full" src={GIF_VIDEO_SRC} loop />
        </VideoSkinComponent>
      </VideoPlayer>
      <figure className="flex flex-col items-center gap-2 text-sm opacity-70">
        <img className="h-32 w-auto rounded" src={GIF_VIDEO_SRC} alt="The same GIF rendered by the browser" />
        <figcaption>
          The same file as an <code>&lt;img&gt;</code>: it just loops.
        </figcaption>
      </figure>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

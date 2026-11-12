import '@app/styles.css';
import './styles.css';
import { Container } from '@videojs/react';
import { VideoPlayer } from '@videojs/react/video';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { ChartMedia } from './chart-media';
import { ChartMediaView } from './chart-media-view';
import { ControlBar } from './controls';
import { Banner, Hud, Lanes, Lyrics, Results, TitleCard } from './overlays';
import { SONG_URL } from './song';
import { SongTracks } from './song-tracks';
import { useGame } from './use-game';

function App() {
  const [media] = useState(() => new ChartMedia());
  const { song, part } = useChart(media);

  useEffect(() => {
    media.src = SONG_URL;
  }, [media]);

  return (
    // No skin: the game draws its own UI, and owns the keyboard.
    <VideoPlayer>
      <main className="guitar-hero">
        <Container className="stage">
          <div className="screen">
            <ChartMediaView media={media} className="highway" />
            {song && part && (
              <>
                <SongTracks song={song} part={part} />
                {/* A new part starts a new game. */}
                <Game key={part.id} clock={media} />
                <TitleCard song={song} />
              </>
            )}
          </div>
          {song && <ControlBar song={song} />}
        </Container>
        {song && <p className="credits">{song.credits}</p>}
      </main>
    </VideoPlayer>
  );
}

function Game({ clock }: { clock: ChartMedia }) {
  const game = useGame(clock);

  return (
    <>
      <Hud game={game} />
      <Banner banner={game.banner} />
      <Lyrics />
      <Lanes game={game} />
      <Results game={game} />
    </>
  );
}

/** The song once it loads, and the part being played, which the quality menu picks. */
function useChart(media: ChartMedia) {
  const [chart, setChart] = useState({ song: media.song, part: media.part });

  useEffect(() => {
    const update = () => setChart({ song: media.song, part: media.part });

    media.addEventListener('partchange', update);

    return () => media.removeEventListener('partchange', update);
  }, [media]);

  return chart;
}

createRoot(document.getElementById('root')!).render(<App />);

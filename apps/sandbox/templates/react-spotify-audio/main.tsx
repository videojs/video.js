import '@app/styles.css';
import { AudioPlayer } from '@app/shared/react/players';
import { AudioSkinComponent } from '@app/shared/react/skins';
import { useSandbox } from '@app/shared/react/use-sandbox';
import { SPOTIFY_AUDIO_SRC } from '@app/shared/sources';
import { SpotifyAudio } from '@videojs/react/media/spotify-audio';
import { createRoot } from 'react-dom/client';

function App() {
  const { mediaProps } = useSandbox();

  return (
    <AudioPlayer>
      <AudioSkinComponent>
        {/* Hidden unless it is showing Spotify's own chrome, so it takes no room and needs no size. */}
        <SpotifyAudio src={SPOTIFY_AUDIO_SRC} {...mediaProps} />
      </AudioSkinComponent>
    </AudioPlayer>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

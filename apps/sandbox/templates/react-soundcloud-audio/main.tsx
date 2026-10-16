import '@app/styles.css';
import { AudioPlayer } from '@app/shared/react/players';
import { AudioSkinComponent } from '@app/shared/react/skins';
import { useSandbox } from '@app/shared/react/use-sandbox';
import { SOURCES } from '@app/shared/sources';
import { SoundCloudAudio } from '@videojs/react/media/soundcloud-audio';
import { createRoot } from 'react-dom/client';

function App() {
  const { source } = useSandbox();

  return (
    <AudioPlayer>
      <AudioSkinComponent>
        <SoundCloudAudio src={SOURCES[source].url ?? ''} />
      </AudioSkinComponent>
    </AudioPlayer>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

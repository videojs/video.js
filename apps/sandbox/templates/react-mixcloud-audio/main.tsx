import '@app/styles.css';
import { AudioPlayer } from '@app/shared/react/players';
import { AudioSkinComponent } from '@app/shared/react/skins';
import { useSandbox } from '@app/shared/react/use-sandbox';
import { SOURCES } from '@app/shared/sources';
import { MixcloudAudio } from '@videojs/react/media/mixcloud-audio';
import { createRoot } from 'react-dom/client';

function App() {
  const { source } = useSandbox();
  const { url = '', controls = false } = SOURCES[source];

  return (
    <AudioPlayer>
      <AudioSkinComponent>
        {/* Hidden unless it is showing Mixcloud's own chrome, so it takes no room and needs no size. */}
        <MixcloudAudio src={url} controls={controls} />
      </AudioSkinComponent>
    </AudioPlayer>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

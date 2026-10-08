import '@app/styles.css';
import { VideoPlayer } from '@app/shared/react/players';
import { VideoSkinComponent } from '@app/shared/react/skins';
import { useSandbox } from '@app/shared/react/use-sandbox';
import { SOURCES } from '@app/shared/sources';
import { PlayerJsVideo } from '@videojs/react/media/playerjs-video';
import { createRoot } from 'react-dom/client';

function App() {
  const { source } = useSandbox();

  return (
    <VideoPlayer>
      <VideoSkinComponent>
        <PlayerJsVideo className="block h-full w-full" src={SOURCES[source].url ?? ''} playsInline />
      </VideoSkinComponent>
    </VideoPlayer>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

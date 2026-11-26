import '@app/styles.css';
import { VideoPlayer } from '@app/shared/react/players';
import { VideoSkinComponent } from '@app/shared/react/skins';
import { useSandbox } from '@app/shared/react/use-sandbox';
import { SOURCES } from '@app/shared/sources';
import { VidyardVideo } from '@videojs/react/media/vidyard-video';
import { createRoot } from 'react-dom/client';

function App() {
  const { source, mediaProps } = useSandbox();
  const { url = '', controls = false } = SOURCES[source];

  return (
    <VideoPlayer>
      <VideoSkinComponent>
        <VidyardVideo src={url} {...mediaProps} controls={controls} playsInline />
      </VideoSkinComponent>
    </VideoPlayer>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

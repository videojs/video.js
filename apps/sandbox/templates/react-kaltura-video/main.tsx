import '@app/styles.css';
import { VideoPlayer } from '@app/shared/react/players';
import { SandboxI18nProvider } from '@app/shared/react/sandbox-i18n';
import { VideoSkinComponent } from '@app/shared/react/skins';
import { useSandbox } from '@app/shared/react/use-sandbox';
import { SOURCES } from '@app/shared/sources';
import { KalturaVideo } from '@videojs/react/media/kaltura-video';
import { createRoot } from 'react-dom/client';

function App() {
  const { source, mediaProps } = useSandbox();
  const { url = '' } = SOURCES[source];

  // The poster and the title come from the Kaltura entry, so the player names neither.
  return (
    <SandboxI18nProvider>
      <VideoPlayer>
        <VideoSkinComponent>
          <KalturaVideo src={url} {...mediaProps} playsInline crossOrigin="" />
        </VideoSkinComponent>
      </VideoPlayer>
    </SandboxI18nProvider>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

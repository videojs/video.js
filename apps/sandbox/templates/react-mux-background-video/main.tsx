import '@app/styles.css';
import '@videojs/react/background/skin.css';
import { BackgroundVideoPlayer } from '@app/shared/react/players';
import { SandboxI18nProvider } from '@app/shared/react/sandbox-i18n';
import { useSandbox } from '@app/shared/react/use-sandbox';
import { SOURCES, withMuxMaxResolution } from '@app/shared/sources';
import { BackgroundVideoSkin } from '@videojs/react/background';
import { MuxBackgroundVideo } from '@videojs/react/media/mux-background-video';
import { createRoot } from 'react-dom/client';

// `MuxBackgroundVideo` is `HlsBackgroundVideo` over the Mux Media, which composes
// `mpegTsTransmuxFeature`: a plus- or basic-tier playback ID (MPEG-TS) plays here
// and is refused on `react-hls-background-video`. This page also adds
// `?max_resolution=720p`: capping the rendition is a Mux URL param rather than a
// prop, so the excluded renditions are absent from the manifest rather than
// present and unpicked.

function App() {
  const { source } = useSandbox();

  return (
    <SandboxI18nProvider>
      <BackgroundVideoPlayer>
        <BackgroundVideoSkin>
          <MuxBackgroundVideo src={withMuxMaxResolution(SOURCES[source].url ?? '', '720p')} crossOrigin="" />
        </BackgroundVideoSkin>
      </BackgroundVideoPlayer>
    </SandboxI18nProvider>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

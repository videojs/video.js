import '@app/styles.css';
import { AudioPlayer, LiveAudioPlayer } from '@app/shared/react/players';
import { SandboxI18nProvider } from '@app/shared/react/sandbox-i18n';
import { AudioSkinComponent } from '@app/shared/react/skins';
import { useSandbox } from '@app/shared/react/use-sandbox';
import { isLiveSource, SOURCES } from '@app/shared/sources';
import { GoogleCast } from '@videojs/react/extensions/google-cast';
import { MuxData } from '@videojs/react/extensions/mux-data';
import { MuxAudio } from '@videojs/react/media/mux-audio/hls-js';
import { createRoot } from 'react-dom/client';

// The hls.js-backed counterpart to `react-mux-audio`, which is the default
// SPF-backed component. See that page's HTML sibling for what differs.

function App() {
  const { source, mediaProps } = useSandbox();
  const live = isLiveSource(source);
  const Player = live ? LiveAudioPlayer : AudioPlayer;

  // A source carrying signed tokens has no room in a plain `src`, so it is passed
  // structured instead — the same way `react-mux-video-hls-js` does.
  const { source: muxSource, url } = SOURCES[source];

  return (
    <SandboxI18nProvider>
      <Player>
        <AudioSkinComponent live={live}>
          <MuxAudio {...(muxSource ? { source: muxSource } : { src: url ?? '' })} {...mediaProps} crossOrigin="" />
          {/* Mux Data and Cast are opt-in media components; no env key is needed for Mux-hosted sources. */}
          <MuxData playerSoftwareName="mux-audio" />
          <GoogleCast />
        </AudioSkinComponent>
      </Player>
    </SandboxI18nProvider>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

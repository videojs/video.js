import '@app/styles.css';
import { AudioPlayer, LiveAudioPlayer } from '@app/shared/react/players';
import { SandboxI18nProvider } from '@app/shared/react/sandbox-i18n';
import { AudioSkinComponent } from '@app/shared/react/skins';
import { useSandbox } from '@app/shared/react/use-sandbox';
import { isLiveSource, SOURCES } from '@app/shared/sources';
import { GoogleCast } from '@videojs/react/extensions/google-cast';
import { MuxData } from '@videojs/react/extensions/mux-data';
import { MuxAudio } from '@videojs/react/media/mux-audio/spf';
import { createRoot } from 'react-dom/client';

// The SPF-backed counterpart to `react-mux-audio`. See that page's HTML sibling
// for what differs: the audio-only engine fetches only audio renditions, and this
// flavor transmuxes Mux's MPEG-TS packaging, so an audio-only TS playback ID
// plays while a plus-tier video asset's muxed audio does not.

function App() {
  const { source, mediaProps } = useSandbox();
  const live = isLiveSource(source);
  const Player = live ? LiveAudioPlayer : AudioPlayer;

  // A source carrying signed tokens has no room in a plain `src`. A `drm.token`
  // is accepted but inert on this flavor.
  const { source: muxSource, url } = SOURCES[source];

  return (
    <SandboxI18nProvider>
      <Player>
        <AudioSkinComponent live={live}>
          <MuxAudio {...(muxSource ? { source: muxSource } : { src: url ?? '' })} {...mediaProps} crossOrigin="" />
          {/*
            Both are opt-in media components, and no env key is needed for Mux-hosted sources.
            Mux Data monitors this flavor from the media element alone: its engine integrations are
            hls.js and dash.js, so an SPF engine gets element-level data and says so in dev.
          */}
          <MuxData playerSoftwareName="mux-audio" />
          <GoogleCast />
        </AudioSkinComponent>
      </Player>
    </SandboxI18nProvider>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

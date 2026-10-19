import '@app/styles.css';
import { LiveVideoPlayer, VideoPlayer } from '@app/shared/react/players';
import { SandboxI18nProvider } from '@app/shared/react/sandbox-i18n';
import { VideoSkinComponent } from '@app/shared/react/skins';
import { useSandbox } from '@app/shared/react/use-sandbox';
import { getPlaceholderSrc, getPosterSrc, isLiveSource, SOURCES } from '@app/shared/sources';
import { GoogleCast } from '@videojs/react/extensions/google-cast';
import { MuxData } from '@videojs/react/extensions/mux-data';
import { MuxVideo } from '@videojs/react/media/mux-video/spf';
import { createRoot } from 'react-dom/client';

// The SPF-backed counterpart to `react-mux-video`. See that page's HTML sibling
// for what differs: this flavor transmuxes Mux's MPEG-TS packaging to fMP4, so
// plus- and basic-tier playback IDs play. DRM plays here, licensed from
// `source.drm`, apart from the unlicensed asset.
//
// Mux Data and Cast both work here, as on the hls.js-backed page — Mux Data
// monitors this flavor from the media element alone, since its engine
// integrations are hls.js and dash.js.

function App() {
  const { source, mediaProps } = useSandbox();
  const placeholder = getPlaceholderSrc(source);
  const live = isLiveSource(source);
  const Player = live ? LiveVideoPlayer : VideoPlayer;

  // A source carrying signed tokens has no room in a plain `src`. A `drm.token`
  // licenses the protected assets: the Media derives Mux's license servers from it.
  const { source: muxSource, url } = SOURCES[source];

  return (
    <SandboxI18nProvider>
      <Player poster={getPosterSrc(source)}>
        <VideoSkinComponent
          renderPoster={
            placeholder ? (
              <img
                alt=""
                crossOrigin=""
                style={{
                  backgroundImage: `url("${placeholder}")`,
                  backgroundPosition: 'var(--media-object-position, center)',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: 'contain',
                }}
              />
            ) : undefined
          }
          live={live}
        >
          {/* The storyboard track is derived automatically from the Mux src. */}
          <MuxVideo
            {...(muxSource ? { source: muxSource } : { src: url ?? '' })}
            {...mediaProps}
            playsInline
            crossOrigin=""
          />
          {/* Opt-in media components; no env key is needed for Mux-hosted sources. */}
          <MuxData playerSoftwareName="mux-video" />
          <GoogleCast />
        </VideoSkinComponent>
      </Player>
    </SandboxI18nProvider>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

import '@app/styles.css';
import { Chapters } from '@app/shared/react/chapters';
import { LiveVideoPlayer, VideoPlayer } from '@app/shared/react/players';
import { SandboxI18nProvider } from '@app/shared/react/sandbox-i18n';
import { VideoSkinComponent } from '@app/shared/react/skins';
import { useSandbox } from '@app/shared/react/use-sandbox';
import { getChapters, getPlaceholderSrc, getPosterSrc, isLiveSource, SOURCES } from '@app/shared/sources';
import { GoogleCast } from '@videojs/react/extensions/google-cast';
import { MuxData } from '@videojs/react/extensions/mux-data';
import { MuxVideo } from '@videojs/react/media/mux-video';
import { createRoot } from 'react-dom/client';

// `MuxVideo` as it is imported by default: the SPF-backed flavor. The
// hls.js-backed one is in `react-mux-video-hls-js`. See this page's HTML sibling
// for what differs.

function App() {
  const { source, mediaProps } = useSandbox();
  const placeholder = getPlaceholderSrc(source);
  const live = isLiveSource(source);
  const Player = live ? LiveVideoPlayer : VideoPlayer;

  // A source carrying signed tokens has no room in a plain `src`. A Mux
  // `drm.token` becomes the FairPlay / Widevine / PlayReady license servers.
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
          // Replaces the skin's preview image so it can carry its own loading hints; the skin still fills in the frame.
          renderThumbnail={<img alt="" decoding="async" fetchPriority="low" />}
          live={live}
        >
          {/* The storyboard track is derived automatically from the Mux src. */}
          <MuxVideo
            {...(muxSource ? { source: muxSource } : { src: url ?? '' })}
            {...mediaProps}
            playsInline
            crossOrigin=""
          >
            <Chapters tracks={getChapters(source)} />
          </MuxVideo>
          {/* Mux Data and Cast are opt-in media components; no env key is needed for Mux-hosted sources. */}
          <MuxData playerSoftwareName="mux-video" />
          <GoogleCast />
        </VideoSkinComponent>
      </Player>
    </SandboxI18nProvider>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

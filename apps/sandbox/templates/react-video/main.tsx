import '@app/styles.css';
import { Chapters } from '@app/shared/react/chapters';
import { VideoPlayer } from '@app/shared/react/players';
import { SandboxI18nProvider } from '@app/shared/react/sandbox-i18n';
import { VideoSkinComponent } from '@app/shared/react/skins';
import { Storyboard } from '@app/shared/react/storyboard';
import { useSandbox } from '@app/shared/react/use-sandbox';
import { getChapters, getPosterSrc, getStoryboardSrc, SOURCES } from '@app/shared/sources';
import { GoogleCast } from '@videojs/react/extensions/google-cast';
import { Video } from '@videojs/react/video';
import { createRoot } from 'react-dom/client';

function App() {
  const { source, mediaProps } = useSandbox();

  return (
    <SandboxI18nProvider>
      <VideoPlayer poster={getPosterSrc(source)}>
        {/* The skin renders its own <img> from `poster`; supplying one is what lets it carry a CORS mode. */}
        <VideoSkinComponent renderPoster={<img alt="" crossOrigin="" />}>
          <Video src={SOURCES[source].url} {...mediaProps} playsInline crossOrigin="">
            <Chapters tracks={getChapters(source)} />
            <Storyboard src={getStoryboardSrc(source)} />
          </Video>
          {/* Cast works with a plain <Video />; the extension goes anywhere inside the player. */}
          <GoogleCast />
        </VideoSkinComponent>
      </VideoPlayer>
    </SandboxI18nProvider>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

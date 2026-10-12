import '@app/styles.css';
import { VideoPlayer } from '@app/shared/react/players';
import { VideoSkinComponent } from '@app/shared/react/skins';
import { useSandbox } from '@app/shared/react/use-sandbox';
import { getYouTubeSource, SOURCES } from '@app/shared/sources';
import { YouTubeVideo } from '@videojs/react/media/youtube-video';
import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  const { source } = useSandbox();

  // A source carrying YouTube player parameters has no room in a plain `src`. Memoized because every new object is a
  // source change to the media.
  const youtubeSource = useMemo(() => getYouTubeSource(source), [source]);

  return (
    <VideoPlayer>
      <VideoSkinComponent>
        <YouTubeVideo
          className="block h-full w-full"
          {...(youtubeSource ? { source: youtubeSource } : { src: SOURCES[source].url ?? '' })}
          playsInline
        />
      </VideoSkinComponent>
    </VideoPlayer>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

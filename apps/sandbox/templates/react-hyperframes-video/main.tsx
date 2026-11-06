import '@app/styles.css';
import { VideoPlayer } from '@app/shared/react/players';
import { VideoSkinComponent } from '@app/shared/react/skins';
import { useSandbox } from '@app/shared/react/use-sandbox';
import { HYPERFRAMES_VIDEO_SRC } from '@app/shared/sources';
import { HyperFramesVideo } from '@videojs/react/media/hyperframes-video';
import { createRoot } from 'react-dom/client';

function App() {
  const { mediaProps } = useSandbox();
  // `HyperFramesVideo` takes the media's own `autoplay`, not the `<video>`-style `autoPlay` alias.
  const { autoPlay, ...hyperFramesProps } = mediaProps;

  return (
    <VideoPlayer>
      <VideoSkinComponent>
        <HyperFramesVideo
          className="block h-full w-full"
          src={HYPERFRAMES_VIDEO_SRC}
          autoplay={autoPlay}
          {...hyperFramesProps}
          playsInline
        />
      </VideoSkinComponent>
    </VideoPlayer>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

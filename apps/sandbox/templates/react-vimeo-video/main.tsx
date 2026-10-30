import '@app/styles.css';
import { VideoPlayer } from '@app/shared/react/players';
import { VideoSkinComponent } from '@app/shared/react/skins';
import { useSandbox } from '@app/shared/react/use-sandbox';
import { VIMEO_VIDEO_SRC } from '@app/shared/sources';
import { VimeoVideo } from '@videojs/react/media/vimeo-video';
import { createRoot } from 'react-dom/client';

function App() {
  const { mediaProps } = useSandbox();

  return (
    <VideoPlayer>
      <VideoSkinComponent>
        <VimeoVideo className="block h-full w-full" src={VIMEO_VIDEO_SRC} {...mediaProps} playsInline />
      </VideoSkinComponent>
    </VideoPlayer>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

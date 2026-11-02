import '@app/styles.css';
import { VideoPlayer } from '@app/shared/react/players';
import { VideoSkinComponent } from '@app/shared/react/skins';
import { useSandbox } from '@app/shared/react/use-sandbox';
import { TIKTOK_VIDEO_SRC } from '@app/shared/sources';
import { TikTokVideo } from '@videojs/react/media/tiktok-video';
import { createRoot } from 'react-dom/client';

function App() {
  const { mediaProps } = useSandbox();

  return (
    <VideoPlayer>
      <VideoSkinComponent>
        <TikTokVideo className="block h-full w-full" src={TIKTOK_VIDEO_SRC} {...mediaProps} playsInline />
      </VideoSkinComponent>
    </VideoPlayer>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

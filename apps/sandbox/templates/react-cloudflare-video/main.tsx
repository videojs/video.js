import '@app/styles.css';
import { VideoPlayer } from '@app/shared/react/players';
import { VideoSkinComponent } from '@app/shared/react/skins';
import { useSandbox } from '@app/shared/react/use-sandbox';
import { CLOUDFLARE_VIDEO_SRC } from '@app/shared/sources';
import { CloudflareVideo } from '@videojs/react/media/cloudflare-video';
import { createRoot } from 'react-dom/client';

function App() {
  const { mediaProps } = useSandbox();

  return (
    <VideoPlayer>
      <VideoSkinComponent>
        <CloudflareVideo className="block h-full w-full" src={CLOUDFLARE_VIDEO_SRC} {...mediaProps} playsInline />
      </VideoSkinComponent>
    </VideoPlayer>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

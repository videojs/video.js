import '@app/styles.css';
import { VideoPlayer } from '@app/shared/react/players';
import { VideoSkinComponent } from '@app/shared/react/skins';
import { DAILYMOTION_VIDEO_SRC } from '@app/shared/sources';
import { DailymotionVideo } from '@videojs/react/media/dailymotion-video';
import { createRoot } from 'react-dom/client';

function App() {
  return (
    <VideoPlayer>
      <VideoSkinComponent>
        <DailymotionVideo className="block h-full w-full" src={DAILYMOTION_VIDEO_SRC} playsInline />
      </VideoSkinComponent>
    </VideoPlayer>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

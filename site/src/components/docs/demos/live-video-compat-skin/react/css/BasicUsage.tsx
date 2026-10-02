import { CompatLiveVideoSkin, LiveVideoPlayer } from '@videojs/react/live-video';
import { HlsVideo } from '@videojs/react/media/hls-video';

import '@videojs/react/live-video/compat-skin.css';

export default function BasicUsage() {
  return (
    <LiveVideoPlayer>
      <CompatLiveVideoSkin className="react-live-video-compat-skin-basic">
        <HlsVideo src="{{VJS10_DEMO_LIVE_HLS}}" playsInline crossOrigin="anonymous" />
      </CompatLiveVideoSkin>
    </LiveVideoPlayer>
  );
}

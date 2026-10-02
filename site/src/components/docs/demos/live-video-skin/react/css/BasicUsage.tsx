import { LiveVideoPlayer, LiveVideoSkin } from '@videojs/react/live-video';
import { HlsVideo } from '@videojs/react/media/hls-video';

import '@videojs/react/live-video/skin.css';

export default function BasicUsage() {
  return (
    <LiveVideoPlayer>
      <LiveVideoSkin className="react-live-video-skin-basic">
        <HlsVideo src="{{VJS10_DEMO_LIVE_HLS}}" playsInline crossOrigin="anonymous" />
      </LiveVideoSkin>
    </LiveVideoPlayer>
  );
}

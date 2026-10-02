import { LiveVideoPlayer, NeutralLiveVideoSkin } from '@videojs/react/live-video';
import { HlsVideo } from '@videojs/react/media/hls-video';

import '@videojs/react/live-video/neutral-skin.css';

export default function BasicUsage() {
  return (
    <LiveVideoPlayer>
      <NeutralLiveVideoSkin className="react-live-video-neutral-skin-basic">
        <HlsVideo src="{{VJS10_DEMO_LIVE_HLS}}" playsInline crossOrigin="anonymous" />
      </NeutralLiveVideoSkin>
    </LiveVideoPlayer>
  );
}

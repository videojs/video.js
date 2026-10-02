import { BackgroundVideo, BackgroundVideoPlayer, BackgroundVideoSkin } from '@videojs/react/background';

import '@videojs/react/background/skin.css';

export default function BasicUsage() {
  return (
    <BackgroundVideoPlayer>
      <BackgroundVideoSkin className="react-background-video-skin-basic">
        <BackgroundVideo src="{{VJS10_DEMO_BACKGROUND_VIDEO_MP4}}" />
      </BackgroundVideoSkin>
    </BackgroundVideoPlayer>
  );
}

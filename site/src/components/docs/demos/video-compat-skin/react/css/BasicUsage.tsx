import { CompatVideoSkin, Video, VideoPlayer } from '@videojs/react/video';

import '@videojs/react/video/compat-skin.css';

export default function BasicUsage() {
  return (
    <VideoPlayer poster="{{VJS10_DEMO_POSTER}}">
      <CompatVideoSkin className="react-video-compat-skin-basic">
        <Video src="{{VJS10_DEMO_VIDEO_MP4}}" playsInline crossOrigin="anonymous">
          <track kind="metadata" label="thumbnails" src="{{VJS10_DEMO_STORYBOARD_VTT}}" default />
        </Video>
      </CompatVideoSkin>
    </VideoPlayer>
  );
}

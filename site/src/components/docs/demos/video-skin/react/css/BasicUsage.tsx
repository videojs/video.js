import { Video, VideoPlayer, VideoSkin } from '@videojs/react/video';

import '@videojs/react/video/skin.css';

export default function BasicUsage() {
  return (
    <VideoPlayer poster="{{VJS10_DEMO_POSTER}}">
      <VideoSkin className="react-video-skin-basic">
        <Video src="{{VJS10_DEMO_VIDEO_MP4}}" playsInline crossOrigin="anonymous">
          <track kind="metadata" label="thumbnails" src="{{VJS10_DEMO_STORYBOARD_VTT}}" default />
        </Video>
      </VideoSkin>
    </VideoPlayer>
  );
}

import { NeutralVideoSkin, Video, VideoPlayer } from '@videojs/react/video';

import '@videojs/react/video/neutral-skin.css';

export default function BasicUsage() {
  return (
    <VideoPlayer poster="{{VJS10_DEMO_POSTER}}">
      <NeutralVideoSkin className="react-video-neutral-skin-basic">
        <Video src="{{VJS10_DEMO_VIDEO_MP4}}" playsInline crossOrigin="anonymous">
          <track kind="metadata" label="thumbnails" src="{{VJS10_DEMO_STORYBOARD_VTT}}" default />
        </Video>
      </NeutralVideoSkin>
    </VideoPlayer>
  );
}

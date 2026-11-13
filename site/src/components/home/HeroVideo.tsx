import { HlsJsVideo } from '@videojs/react/media/hlsjs-video';
import { VideoPlayer, VideoSkin } from '@videojs/react/video';

import { VJS10_DEMO_VIDEO } from '@/consts';

import '@videojs/react/video/skin.css';

export default function HeroVideo({
  className,
  poster,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
  poster: string;
}) {
  return (
    <VideoPlayer poster={poster}>
      <VideoSkin
        className={className}
        style={
          {
            '--media-border-radius': `calc(var(--spacing) * 6)`,
            '--media-object-fit': 'cover',
            // The hero hides the centre controls behind its headline, so keep the control bar before playback starts.
            '--media-controls-before-start': 'visible',
            ...style,
          } as React.CSSProperties
        }
      >
        <HlsJsVideo src={VJS10_DEMO_VIDEO.hls} playsInline crossOrigin="anonymous">
          <track
            kind="metadata"
            label="thumbnails"
            src={`https://image.mux.com/${VJS10_DEMO_VIDEO.id}/storyboard.vtt`}
            default
          />
        </HlsJsVideo>
      </VideoSkin>
    </VideoPlayer>
  );
}

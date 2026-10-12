#!/usr/bin/env bash
# Reference solution for the oracle agent: the media element's own events, as props on the Video component, which
# makes the player a client component.
set -euo pipefail

cat > components/player.tsx <<'TSX'
'use client';

import '@videojs/react/video/skin.css';
import { Video, VideoPlayer, VideoSkin } from '@videojs/react/video';
import type { SyntheticEvent } from 'react';

function track(event: string) {
  return ({ currentTarget }: SyntheticEvent<HTMLVideoElement>) => {
    window.acme?.track(event, { currentTime: currentTarget.currentTime });
  };
}

export function Player({ src }: { src: string }) {
  return (
    <VideoPlayer>
      <VideoSkin style={{ width: '100%', aspectRatio: '16 / 9' }}>
        <Video
          src={src}
          playsInline
          onPlay={track('video_play')}
          onPause={track('video_pause')}
          onEnded={track('video_ended')}
        />
      </VideoSkin>
    </VideoPlayer>
  );
}
TSX

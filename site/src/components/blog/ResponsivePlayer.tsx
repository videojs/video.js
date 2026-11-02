import { createPlayer, selectControls } from '@videojs/react';
import { VideoSkin, videoFeatures } from '@videojs/react/video';

import { CosmicDawnVideo, useControlsLock } from './CosmicDawnVideo';

import '@videojs/react/video/skin.css';

const { Player, usePlayer } = createPlayer({ features: videoFeatures });

function ControlsLock() {
  useControlsLock(usePlayer(selectControls)?.requestControlsLock);

  return null;
}

export default function ResponsivePlayer() {
  return (
    <Player>
      <ControlsLock />
      <VideoSkin className="aspect-video w-full">
        <CosmicDawnVideo />
      </VideoSkin>
    </Player>
  );
}

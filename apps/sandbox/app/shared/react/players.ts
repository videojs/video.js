import { createPlayer, features } from '@videojs/react';
import { audioFeatures } from '@videojs/react/audio';
import { backgroundFeatures } from '@videojs/react/background';
import { liveAudioFeatures } from '@videojs/react/live-audio';
import { liveVideoFeatures } from '@videojs/react/live-video';
import { videoFeatures } from '@videojs/react/video';

export const { Player: VideoPlayer } = createPlayer({
  features: [...videoFeatures, features.orientationLock],
});

export const { Player: AudioPlayer } = createPlayer({
  features: audioFeatures,
});

export const { Player: BackgroundVideoPlayer } = createPlayer({
  features: backgroundFeatures,
});

// Live players register `liveFeature` so the LiveButton can read
// `liveEdgeStart` / `targetLiveWindow` and seek to the live edge.
export const { Player: LiveVideoPlayer } = createPlayer({
  features: liveVideoFeatures,
});

export const { Player: LiveAudioPlayer } = createPlayer({
  features: liveAudioFeatures,
});

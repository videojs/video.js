import type {
  AudioPlayerStore,
  BackgroundPlayerStore,
  LiveAudioPlayerStore,
  LiveVideoPlayerStore,
  VideoPlayerStore,
} from '@videojs/core/dom';
import { assertType, describe, it } from 'vite-plus/test';

import type { PlayerController as PlayerControllerInstance } from '../../player/controller';
import type { UIElement } from '../../ui/ui-element';
import { PlayerController as AudioPlayerController } from '../audio';
import { PlayerController as BackgroundPlayerController } from '../background';
import { PlayerController as LiveAudioPlayerController } from '../live-audio';
import { PlayerController as LiveVideoPlayerController } from '../live-video';
import { PlayerController as VideoPlayerController } from '../video';

describe('HTML preset PlayerController exports', () => {
  it('bind each controller to the preset store', () => {
    const host = null as unknown as UIElement;

    assertType<PlayerControllerInstance<VideoPlayerStore>>(new VideoPlayerController(host));
    assertType<PlayerControllerInstance<AudioPlayerStore>>(new AudioPlayerController(host));
    assertType<PlayerControllerInstance<LiveVideoPlayerStore>>(new LiveVideoPlayerController(host));
    assertType<PlayerControllerInstance<LiveAudioPlayerStore>>(new LiveAudioPlayerController(host));
    assertType<PlayerControllerInstance<BackgroundPlayerStore>>(new BackgroundPlayerController(host));
  });
});

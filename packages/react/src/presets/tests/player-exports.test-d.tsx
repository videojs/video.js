import type {
  AudioPlayerStore,
  BackgroundPlayerStore,
  LiveAudioPlayerStore,
  LiveVideoPlayerStore,
  VideoPlayerStore,
} from '@videojs/core/dom';
import { usePlayer as useAudioPlayer } from '@videojs/react/audio';
import { usePlayer as useBackgroundPlayer } from '@videojs/react/background';
import { usePlayer as useLiveAudioPlayer } from '@videojs/react/live-audio';
import { usePlayer as useLiveVideoPlayer } from '@videojs/react/live-video';
import { usePlayer as useVideoPlayer } from '@videojs/react/video';
import { describe, expectTypeOf, it } from 'vite-plus/test';

describe('usePlayer', () => {
  it('preserves preset store and selector types through the built package exports', () => {
    function Consumers() {
      expectTypeOf(useVideoPlayer()).toEqualTypeOf<VideoPlayerStore>();
      expectTypeOf(useAudioPlayer()).toEqualTypeOf<AudioPlayerStore>();
      expectTypeOf(useBackgroundPlayer()).toEqualTypeOf<BackgroundPlayerStore>();
      expectTypeOf(useLiveVideoPlayer()).toEqualTypeOf<LiveVideoPlayerStore>();
      expectTypeOf(useLiveAudioPlayer()).toEqualTypeOf<LiveAudioPlayerStore>();

      expectTypeOf(useVideoPlayer((state) => state.paused)).toEqualTypeOf<boolean>();
      expectTypeOf(useAudioPlayer((state) => state.paused)).toEqualTypeOf<boolean>();
      expectTypeOf(useLiveVideoPlayer((state) => state.paused)).toEqualTypeOf<boolean>();
      expectTypeOf(useLiveAudioPlayer((state) => state.paused)).toEqualTypeOf<boolean>();
      return null;
    }

    void Consumers;
  });
});

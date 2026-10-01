/**
 * Type-level guard on the engines' derived state and context types: that each is a closed set of keys (a behavior typed
 * with an index signature would open the whole engine's type to any key), and that each engine's external signals are
 * part of its state even though no behavior declares them.
 */
import { describe, expectTypeOf, it } from 'vite-plus/test';

import type { AudioTrack, TextTrack, VideoTrack } from '../../../../media/types';
import type * as hlsVideo from '../engine';
import type * as hlsAudio from '../engine-audio-only';
import type * as hlsBackgroundVideo from '../engine-background-video';

type IsOpen<T> = string extends keyof T ? true : false;

describe('EngineState', () => {
  it('is a closed set of keys in every engine', () => {
    expectTypeOf<IsOpen<hlsVideo.EngineState>>().toEqualTypeOf<false>();
    expectTypeOf<IsOpen<hlsAudio.EngineState>>().toEqualTypeOf<false>();
    expectTypeOf<IsOpen<hlsBackgroundVideo.EngineState>>().toEqualTypeOf<false>();
  });

  it('includes the video engine’s external signals', () => {
    expectTypeOf<hlsVideo.EngineState['userVideoTrackSelection']>().toEqualTypeOf<Partial<VideoTrack> | undefined>();
    expectTypeOf<hlsVideo.EngineState['userAudioTrackSelection']>().toEqualTypeOf<Partial<AudioTrack> | undefined>();
    expectTypeOf<hlsVideo.EngineState['userTextTrackSelection']>().toEqualTypeOf<
      Partial<TextTrack> | 'off' | undefined
    >();
    expectTypeOf<hlsVideo.EngineState['disableRemotePlayback']>().toEqualTypeOf<boolean | undefined>();
  });

  it('includes the audio engine’s external signals, and no video or text selection', () => {
    expectTypeOf<hlsAudio.EngineState['userAudioTrackSelection']>().toEqualTypeOf<Partial<AudioTrack> | undefined>();
    expectTypeOf<hlsAudio.EngineState['disableRemotePlayback']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<hlsAudio.EngineState>().not.toHaveProperty('userVideoTrackSelection');
    expectTypeOf<hlsAudio.EngineState>().not.toHaveProperty('userTextTrackSelection');
  });
});

describe('EngineContext', () => {
  it('is a closed set of keys in every engine', () => {
    expectTypeOf<IsOpen<hlsVideo.EngineContext>>().toEqualTypeOf<false>();
    expectTypeOf<IsOpen<hlsAudio.EngineContext>>().toEqualTypeOf<false>();
    expectTypeOf<IsOpen<hlsBackgroundVideo.EngineContext>>().toEqualTypeOf<false>();
  });
});

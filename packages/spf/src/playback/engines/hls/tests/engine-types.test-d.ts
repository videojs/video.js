/**
 * Type-level guard on the engines' derived state and context types: that each is a closed set of keys (a behavior typed
 * with an index signature would open the whole engine's type to any key), and that each engine's consumer inputs are
 * part of its state even though no behavior declares them.
 */
import { describe, expectTypeOf, it } from 'vite-plus/test';

import type { AudioTrack, TextTrack, VideoTrack } from '../../../../media/types';
import type { HlsVideoEngineContext, HlsVideoEngineState } from '../engine';
import type { HlsAudioEngineContext, HlsAudioEngineState } from '../engine-audio-only';
import type { BackgroundVideoEngineContext, BackgroundVideoEngineState } from '../engine-background-video';

type IsOpen<T> = string extends keyof T ? true : false;

describe('HlsVideoEngineState', () => {
  it('is a closed set of keys', () => {
    expectTypeOf<IsOpen<HlsVideoEngineState>>().toEqualTypeOf<false>();
  });

  it('includes the consumer inputs', () => {
    expectTypeOf<HlsVideoEngineState['userVideoTrackSelection']>().toEqualTypeOf<Partial<VideoTrack> | undefined>();
    expectTypeOf<HlsVideoEngineState['userAudioTrackSelection']>().toEqualTypeOf<Partial<AudioTrack> | undefined>();
    expectTypeOf<HlsVideoEngineState['userTextTrackSelection']>().toEqualTypeOf<
      Partial<TextTrack> | 'off' | undefined
    >();
    expectTypeOf<HlsVideoEngineState['disableRemotePlayback']>().toEqualTypeOf<boolean | undefined>();
  });
});

describe('HlsVideoEngineContext', () => {
  it('is a closed set of keys', () => {
    expectTypeOf<IsOpen<HlsVideoEngineContext>>().toEqualTypeOf<false>();
  });
});

describe('HlsAudioEngineState', () => {
  it('is a closed set of keys', () => {
    expectTypeOf<IsOpen<HlsAudioEngineState>>().toEqualTypeOf<false>();
  });

  it('includes the consumer inputs, and no video or text selection', () => {
    expectTypeOf<HlsAudioEngineState['userAudioTrackSelection']>().toEqualTypeOf<Partial<AudioTrack> | undefined>();
    expectTypeOf<HlsAudioEngineState['disableRemotePlayback']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<HlsAudioEngineState>().not.toHaveProperty('userVideoTrackSelection');
    expectTypeOf<HlsAudioEngineState>().not.toHaveProperty('userTextTrackSelection');
  });
});

describe('HlsAudioEngineContext', () => {
  it('is a closed set of keys', () => {
    expectTypeOf<IsOpen<HlsAudioEngineContext>>().toEqualTypeOf<false>();
  });
});

describe('BackgroundVideoEngineState', () => {
  it('is a closed set of keys', () => {
    expectTypeOf<IsOpen<BackgroundVideoEngineState>>().toEqualTypeOf<false>();
  });
});

describe('BackgroundVideoEngineContext', () => {
  it('is a closed set of keys', () => {
    expectTypeOf<IsOpen<BackgroundVideoEngineContext>>().toEqualTypeOf<false>();
  });
});

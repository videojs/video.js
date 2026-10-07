/**
 * Type-level guard on the feature modules' derived types: that a feature's `State`, `Config`, and `Context` carry the
 * keys its behaviors and external signals declare, and that a feature with no behaviors has an empty `Behaviors`
 * tuple.
 */
import { describe, expectTypeOf, it } from 'vite-plus/test';

import type * as shiftTextTimestamps from '../features/shift-text-timestamps';
import type * as video from '../features/video';

describe('State', () => {
  it('carries the keys the video feature’s behaviors and external signals declare', () => {
    expectTypeOf<video.State>().toHaveProperty('selectedVideoTrackId');
    expectTypeOf<video.State>().toHaveProperty('userVideoTrackSelection');
  });
});

describe('Config', () => {
  it('carries the keys the video feature’s behaviors read', () => {
    expectTypeOf<video.Config>().toHaveProperty('canPlayTrack');
  });
});

describe('Context', () => {
  it('carries the keys the video feature’s behaviors declare', () => {
    expectTypeOf<video.Context>().toHaveProperty('videoBufferActor');
  });
});

describe('Behaviors', () => {
  it('is an empty tuple for a feature that only sets config', () => {
    expectTypeOf<shiftTextTimestamps.Behaviors>().toEqualTypeOf<readonly []>();
  });
});

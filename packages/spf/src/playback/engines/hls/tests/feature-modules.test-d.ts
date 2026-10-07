/**
 * Type-level guard on the feature modules' derived types: that a feature's `State`, `Config`, and `Context` carry the
 * keys its behaviors and external signals declare, that a feature with no behaviors has an empty `Behaviors` tuple, and
 * that defaults a feature sets for another feature's behavior are checked against that behavior's config.
 */
import { describe, expectTypeOf, it } from 'vite-plus/test';

import type { ResolveBehaviorConfig } from '../../../../core/composition/define-behavior';
import type { setupMediaSource } from '../../../behaviors/dom/setup-mediasource';
import type * as airPlay from '../features/airplay';
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

describe('defaultConfig', () => {
  it('is checked against the behavior that reads a key the feature sets for another feature', () => {
    type Readers = readonly [...airPlay.Behaviors, typeof setupMediaSource];

    expectTypeOf<typeof airPlay.defaultConfig>().toMatchTypeOf<Partial<ResolveBehaviorConfig<Readers>>>();
    // @ts-expect-error — a value of the wrong type for the reader's key is rejected.
    ({ attachMediaSource: 1 }) satisfies Partial<ResolveBehaviorConfig<Readers>>;
  });
});

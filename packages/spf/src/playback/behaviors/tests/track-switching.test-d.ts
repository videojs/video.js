import { describe, expectTypeOf, it } from 'vite-plus/test';

import type { InferBehaviorConfig } from '../../../core/composition/create-composition';
import { switchAudioTrack, switchVideoTrack } from '../track-switching';

// These setups take `config?:`, which once made `defineBehavior` drop their config
// type: their keys never reached a composition's config, so nothing checked them.
describe('switchVideoTrack', () => {
  it('contributes its config to the composition', () => {
    expectTypeOf<InferBehaviorConfig<typeof switchVideoTrack>>().toHaveProperty('initialBandwidth');
    expectTypeOf<InferBehaviorConfig<typeof switchVideoTrack>>().toHaveProperty('videoRules');
  });
});

describe('switchAudioTrack', () => {
  it('contributes its config to the composition', () => {
    expectTypeOf<InferBehaviorConfig<typeof switchAudioTrack>>().toHaveProperty('audioRules');
  });
});

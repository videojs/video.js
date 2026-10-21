import { describe, expectTypeOf, it } from 'vite-plus/test';

import type { InferBehaviorContext } from '../../../core/composition/define-behavior';
import type { calculatePresentationDuration } from '../calculate-presentation-duration';

describe('calculatePresentationDuration', () => {
  // An index-signature context type here once opened every engine's derived
  // context type to any key.
  it('declares no context keys', () => {
    expectTypeOf<keyof InferBehaviorContext<typeof calculatePresentationDuration>>().toEqualTypeOf<never>();
  });
});

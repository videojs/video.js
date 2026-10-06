import { defineFeature } from '../../../../core/composition/define-feature';
import { collectErrors } from '../../../behaviors/collect-errors';

/** Collects the errors the other features report into `state.errors`, per source. Without it, reporting is a no-op. */
export const errorFeature = defineFeature({
  behaviors: [collectErrors],
});

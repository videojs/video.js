import { defineFeature } from '../../../../core/composition/define-feature';
import { applyStartPosition } from '../../../behaviors/dom/apply-start-position';

/**
 * Starts playback at `state.startPosition` instead of zero. Compose it after `currentTimeFeature`: the one-shot seek
 * must land after the `currentTime` mirror's attach-time sync (see `apply-start-position.ts`).
 */
export const startPositionFeature = defineFeature({
  behaviors: [applyStartPosition],
});

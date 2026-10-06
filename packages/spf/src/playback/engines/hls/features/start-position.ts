import { defineFeature } from '../../../../core/composition/define-feature';
import { applyStartPosition } from '../../../behaviors/dom/apply-start-position';

/**
 * Starts playback at `state.startPosition` instead of zero. Also performs the seeks other features request through
 * `state.startPosition`, such as the live edge and the AirPlay session-end restore.
 */
export const startPositionFeature = defineFeature({
  behaviors: [applyStartPosition],
});

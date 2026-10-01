import { isUndefined } from '@videojs/utils/predicate';

import { DEFAULT_SEEK_STEP } from '../../core/ui/constants';
import { getMediaInputActionValue } from '../media-action-value';
import type { GestureRegion } from './gesture';

/**
 * Resolves the effective value for a gesture action from its explicit value and region.
 *
 * @internal
 */
export function getGestureActionValue(
  action: string,
  region: GestureRegion | undefined,
  value?: number | undefined
): number | undefined {
  if (action === 'seekStep' && isUndefined(value) && region === 'left') return -DEFAULT_SEEK_STEP;

  return getMediaInputActionValue(action, undefined, value);
}

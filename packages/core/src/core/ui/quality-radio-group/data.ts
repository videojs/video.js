import type { StateAttrMap } from '../types';
import type { QualityRadioGroupState } from './core';

/** @internal */
export const QualityRadioGroupDataAttrs = {
  /** Current quality value. */
  value: 'data-quality',
  /** Present when quality selection is disabled. */
  disabled: 'data-disabled',
  /** Present when quality selection is unavailable. */
  hidden: 'data-hidden',
  /** Indicates quality availability (`available` or `unavailable`). */
  availability: 'data-availability',
} as const satisfies StateAttrMap<QualityRadioGroupState>;

import type { StateAttrMap } from '../types';
import type { SliderState } from './core';

/** @internal */
export const SliderDataAttrs = {
  /** Present when the user is actively dragging. */
  dragging: 'data-dragging',
  /** Present when the pointer is over the slider. */
  pointing: 'data-pointing',
  /** Present when dragging, pointing, or focus is active. */
  interactive: 'data-interactive',
  /** Current axis of slider movement (`horizontal` or `vertical`). */
  orientation: 'data-orientation',
  /** Present when the slider is non-interactive. */
  disabled: 'data-disabled',
} as const satisfies StateAttrMap<SliderState>;

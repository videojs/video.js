import type { StateAttrMap } from '../types';
import type { TitleState } from './core';

/** @internal */
export const TitleDataAttrs = {
  /** Present when the element is hidden because no title is available. */
  hidden: 'data-hidden',
  /** Present while the player controls are visible. */
  visible: 'data-visible',
} as const satisfies StateAttrMap<TitleState>;

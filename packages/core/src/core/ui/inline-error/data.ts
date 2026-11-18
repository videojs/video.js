import type { StateAttrMap } from '../types';
import type { InlineErrorState } from './core';

/** @internal */
export const InlineErrorDataAttrs = {
  /** Present while a playback error is showing. */
  visible: 'data-visible',
} as const satisfies StateAttrMap<InlineErrorState>;

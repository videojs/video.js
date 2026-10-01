import type { StateAttrMap } from '../types';
import type { LiveButtonState } from './core';

/** @internal */
export const LiveButtonDataAttrs = {
  /** Present when the stream is live (or DVR). */
  live: 'data-live',
  /** Present when playback is at the live edge. */
  liveEdge: 'data-live-edge',
  /** Present when the button is non-interactive (mirrors `aria-disabled`). */
  disabled: 'data-disabled',
} as const satisfies StateAttrMap<LiveButtonState>;

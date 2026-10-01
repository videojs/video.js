import type { StateAttrMap } from '../types';
import type { FullscreenButtonState } from './core';

/** @internal */
export const FullscreenButtonDataAttrs = {
  /** Present when fullscreen mode is active. */
  fullscreen: 'data-fullscreen',
  /** Indicates fullscreen availability (`available`, `unavailable`, `unsupported`). */
  availability: 'data-availability',
  /** Present when the button is non-interactive (mirrors `aria-disabled`). */
  disabled: 'data-disabled',
  /** Present when the button is hidden because fullscreen is not available. */
  hidden: 'data-hidden',
} as const satisfies StateAttrMap<FullscreenButtonState>;

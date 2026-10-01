import type { StateAttrMap } from '../types';
import type { CastButtonState } from './core';

/** @internal */
export const CastButtonDataAttrs = {
  /**
   * Current remote playback connection state.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/RemotePlayback/state
   */
  connection: 'data-cast-state',
  /**
   * Whether remote playback can be requested on this platform.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/RemotePlayback
   */
  availability: 'data-availability',
  /** Present when the button is non-interactive (mirrors `aria-disabled`). */
  disabled: 'data-disabled',
  /** Present when the button is hidden because the feature is unsupported. */
  hidden: 'data-hidden',
} as const satisfies StateAttrMap<CastButtonState>;

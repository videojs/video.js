import type { StateAttrMap } from '../types';
import type { AirPlayButtonState } from './core';

/** @internal */
export const AirPlayButtonDataAttrs = {
  /**
   * Current AirPlay connection state.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/RemotePlayback/state
   */
  state: 'data-airplay-state',
  /**
   * Whether AirPlay is available on the active platform and media.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/RemotePlayback
   */
  availability: 'data-availability',
  /** Present when the button is non-interactive (mirrors `aria-disabled`). */
  disabled: 'data-disabled',
  /** Present when the button is hidden because AirPlay is unavailable. */
  hidden: 'data-hidden',
} as const satisfies StateAttrMap<AirPlayButtonState>;

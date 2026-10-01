import type { StateAttrMap } from '../types';
import type { MuteButtonState } from './core';

/** @internal */
export const MuteButtonDataAttrs = {
  /** Present when the media is muted. */
  muted: 'data-muted',
  /** Indicates the volume level. */
  volumeLevel: 'data-volume-level',
  /** Indicates mute availability (`available`, `unavailable`, `unsupported`). */
  availability: 'data-availability',
  /** Present when the button is hidden because the media has no mute to toggle. */
  hidden: 'data-hidden',
} as const satisfies StateAttrMap<MuteButtonState>;

import type { StateAttrMap } from '../types';
import type { PosterState } from './core';

/** @internal */
export const PosterDataAttrs = {
  /** Present until playback starts. */
  visible: 'data-visible',
  /** Present while the poster image is fetching. */
  loading: 'data-loading',
  /** Present once the poster image has decoded. */
  loaded: 'data-loaded',
  /** Present when the poster image failed. */
  error: 'data-error',
} as const satisfies StateAttrMap<PosterState>;

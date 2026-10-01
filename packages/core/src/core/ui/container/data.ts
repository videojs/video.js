import type { StateAttrMap } from '../types';
import type { ContainerState } from './core';

/** @internal */
export const ContainerDataAttrs = {
  /** Present when player controls are visible. */
  controlsVisible: 'data-controls-visible',
} as const satisfies StateAttrMap<ContainerState>;

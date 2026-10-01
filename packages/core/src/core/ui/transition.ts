import type { StateAttrMap } from './types';

export type TransitionStatus = 'idle' | 'starting' | 'ending';

export interface TransitionState {
  /** Whether the element is logically active (stays `true` during ending animations). */
  active: boolean;
  /** Current phase of the transition lifecycle. */
  status: TransitionStatus;
}

export interface TransitionFlags {
  /** Whether the open transition is in progress. */
  transitionStarting: boolean;
  /** Whether the close transition is in progress. */
  transitionEnding: boolean;
}

/** @internal */
export interface TransitionStyleAttrs {
  'data-starting-style'?: '' | undefined;
  'data-ending-style'?: '' | undefined;
}

/**
 * Shared data attributes for open/close transition state. Spread into component data-attrs objects.
 *
 * @internal
 */
export const TransitionDataAttrs = {
  /** Present during the open transition. */
  transitionStarting: 'data-starting-style',
  /** Present during the close transition. */
  transitionEnding: 'data-ending-style',
} as const satisfies StateAttrMap<TransitionFlags>;

/** @internal */
export function getTransitionFlags(status: TransitionStatus): TransitionFlags {
  return {
    transitionStarting: status === 'starting',
    transitionEnding: status === 'ending',
  };
}

/** @internal */
export function getTransitionStyleAttrs({
  transitionStarting,
  transitionEnding,
}: TransitionFlags): TransitionStyleAttrs {
  return {
    [TransitionDataAttrs.transitionStarting]: transitionStarting ? '' : undefined,
    [TransitionDataAttrs.transitionEnding]: transitionEnding ? '' : undefined,
  };
}

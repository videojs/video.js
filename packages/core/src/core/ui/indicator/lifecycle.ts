import type { TransitionFlags, TransitionState } from '../transition';
import { getTransitionFlags } from '../transition';

/** @internal */
export const INDICATOR_CLOSE_DELAY = 800;

export interface IndicatorCoreProps {
  /** Delay in milliseconds before the indicator closes. */
  closeDelay?: number | undefined;
}

export interface IndicatorLifecycleState extends TransitionFlags {
  open: boolean;
  generation: number;
}

/** @internal */
export class IndicatorCloseController {
  #timer: ReturnType<typeof setTimeout> | null = null;
  #close: () => void;
  #getDelay: () => number;

  constructor(close: () => void, getDelay: () => number) {
    this.#close = close;
    this.#getDelay = getDelay;
  }

  arm(): void {
    this.clear();
    this.#timer = setTimeout(() => {
      this.#timer = null;
      this.#close();
    }, this.#getDelay());
  }

  clear(): void {
    if (this.#timer === null) return;

    clearTimeout(this.#timer);
    this.#timer = null;
  }

  close(): void {
    this.clear();
    this.#close();
  }

  destroy(): void {
    this.clear();
  }
}

/** @internal */
export interface IndicatorVisibilityHandle {
  close(): void;
}

/** @internal */
export class IndicatorVisibilityCoordinator<Handle extends IndicatorVisibilityHandle = IndicatorVisibilityHandle> {
  #handles = new Set<Handle>();

  register(handle: Handle): () => void {
    this.#handles.add(handle);
    return () => this.#handles.delete(handle);
  }

  show(handle: Handle): void {
    for (const nextHandle of this.#handles) {
      if (nextHandle !== handle) nextHandle.close();
    }
  }
}

/** @internal */
export function getIndicatorCloseDelay(props: IndicatorCoreProps): number {
  return props.closeDelay ?? INDICATOR_CLOSE_DELAY;
}

/** @internal */
export function isIndicatorPresent(
  current: Pick<IndicatorLifecycleState, 'open'>,
  transition: Pick<TransitionState, 'active'>
): boolean {
  return current.open || transition.active;
}

/** @internal */
export function getRenderedIndicatorState<State extends IndicatorLifecycleState>(
  current: State,
  snapshot: State,
  transition: TransitionState
): State {
  const payload = current.open ? current : snapshot;

  return {
    ...payload,
    open: current.open && transition.active,
    generation: current.open ? current.generation : payload.generation,
    ...getTransitionFlags(transition.status),
  };
}

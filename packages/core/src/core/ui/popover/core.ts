import { defaults } from '@videojs/utils/object';
import type { NonNullableObject } from '@videojs/utils/types';

import type { TransitionFlags, TransitionState, TransitionStatus } from '../transition';
import { getTransitionFlags } from '../transition';

export type PopoverSide = 'top' | 'bottom' | 'left' | 'right';

export type PopoverAlign = 'start' | 'center' | 'end';

export type PopoverBoundary = 'viewport' | 'container' | (string & {});

export interface PopoverProps {
  /** Preferred side of the trigger for the popup. */
  side?: PopoverSide | undefined;
  /** Alignment of the popup along the trigger's edge. */
  align?: PopoverAlign | undefined;
  /** Boundary used to constrain the popup position. */
  boundary?: PopoverBoundary | undefined;
  /**
   * - `false` (default): non-modal; background content remains interactive.
   * - `true`: modal; sets `aria-modal="true"` on the popup.
   * - `'trap-focus'`: reserved for future focus-trapping behavior.
   */
  modal?: boolean | 'trap-focus' | undefined;
  /** Close the popup when the Escape key is pressed. */
  closeOnEscape?: boolean | undefined;
  /** Close the popup when clicking outside the trigger and popup. */
  closeOnOutsideClick?: boolean | undefined;
  /** Controlled open state. When set, the consumer is responsible for toggling. */
  open?: boolean | undefined;
  /** Initial open state for uncontrolled usage. */
  defaultOpen?: boolean | undefined;
  /** Open the popup on pointer hover instead of click. */
  openOnHover?: boolean | undefined;
  /** Delay in ms before opening on hover. */
  delay?: number | undefined;
  /** Delay in ms before closing after pointer leaves. */
  closeDelay?: number | undefined;
}

type PopoverCoreProps = Omit<PopoverProps, 'boundary'>;

/**
 * The raw transition state managed by `createTransition`. Uses `active` (not `open`) to distinguish the generic
 * transition state machine from the domain-specific `PopoverState.open`.
 *
 * @internal
 */
export interface PopoverInput extends TransitionState {}

export interface PopoverState extends TransitionFlags {
  open: boolean;
  status: TransitionStatus;
  /** Preferred side of the trigger for the popup. */
  side: PopoverSide;
  align: PopoverAlign;
  modal: boolean | 'trap-focus';
}

/** @internal */
export class PopoverCore {
  static readonly defaultProps: NonNullableObject<PopoverCoreProps> = {
    side: 'top',
    align: 'center',
    modal: false,
    closeOnEscape: true,
    closeOnOutsideClick: true,
    open: false,
    defaultOpen: false,
    openOnHover: false,
    delay: 300,
    closeDelay: 0,
  };

  #props = { ...PopoverCore.defaultProps };

  constructor(props?: PopoverCoreProps) {
    if (props) this.setProps(props);
  }

  setProps(props: PopoverCoreProps): void {
    this.#props = defaults(props, PopoverCore.defaultProps);
  }

  #input: PopoverInput | null = null;

  setInput(input: PopoverInput): void {
    this.#input = input;
  }

  getState(): PopoverState {
    const input = this.#input!;

    return {
      open: input.active,
      status: input.status,
      side: this.#props.side,
      align: this.#props.align,
      modal: this.#props.modal,
      ...getTransitionFlags(input.status),
    };
  }

  getTriggerAttrs(state: PopoverState, popupId?: string) {
    return {
      'aria-expanded': state.open && state.status !== 'ending' ? 'true' : 'false',
      'aria-haspopup': 'dialog',
      'aria-controls': popupId,
    };
  }

  getPopupAttrs(state: PopoverState) {
    return {
      popover: 'manual' as const,
      role: 'dialog',
      'aria-modal': state.modal === true ? 'true' : undefined,
    };
  }
}

/** @internal */
export namespace PopoverCore {
  export type Props = PopoverCoreProps;
  export type State = PopoverState;
  export type Input = PopoverInput;
}

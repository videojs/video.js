import { defaults } from '@videojs/utils/object';
import type { NonNullableObject } from '@videojs/utils/types';

import type { PopoverAlign, PopoverBoundary, PopoverSide } from '../popover/core';
import type { TransitionFlags, TransitionState, TransitionStatus } from '../transition';
import { getTransitionFlags } from '../transition';

export interface TooltipProps {
  /** Preferred side of the trigger for the tooltip. */
  side?: PopoverSide | undefined;
  /** Alignment of the tooltip along the trigger's edge. */
  align?: PopoverAlign | undefined;
  /** Boundary used to constrain the tooltip position. */
  boundary?: PopoverBoundary | undefined;
  /** Controlled open state. */
  open?: boolean | undefined;
  /** Initial open state for uncontrolled usage. */
  defaultOpen?: boolean | undefined;
  /** Delay in ms before opening on hover. */
  delay?: number | undefined;
  /** Delay in ms before closing after pointer leaves. */
  closeDelay?: number | undefined;
  /** When true, hovering the popup does not keep it open. */
  disableHoverablePopup?: boolean | undefined;
  /** When true, the tooltip is disabled and will not open. */
  disabled?: boolean | undefined;
  /** Whether the tooltip stays open when another popup opens from its trigger. */
  sticky?: boolean | undefined;
}

type TooltipCoreProps = Omit<TooltipProps, 'boundary'>;

/** @internal */
export interface TooltipInput extends TransitionState {}

export interface TooltipState extends TransitionFlags {
  /** Whether the tooltip is currently visible. */
  open: boolean;
  /** Current phase of the transition lifecycle. */
  status: TransitionStatus;
  /** Preferred side of the trigger for the tooltip. */
  side: PopoverSide;
  /** How the tooltip is aligned relative to the specified side. */
  align: PopoverAlign;
}

/** @internal */
export class TooltipCore {
  static readonly defaultProps: NonNullableObject<TooltipCoreProps> = {
    side: 'top',
    align: 'center',
    open: false,
    defaultOpen: false,
    delay: 600,
    closeDelay: 0,
    disableHoverablePopup: true,
    disabled: false,
    sticky: false,
  };

  #props = { ...TooltipCore.defaultProps };

  constructor(props?: TooltipCoreProps) {
    if (props) this.setProps(props);
  }

  setProps(props: TooltipCoreProps): void {
    this.#props = defaults(props, TooltipCore.defaultProps);
  }

  #input: TooltipInput | null = null;

  setInput(input: TooltipInput): void {
    this.#input = input;
  }

  getState(): TooltipState {
    const input = this.#input!;

    return {
      open: input.active,
      status: input.status,
      side: this.#props.side,
      align: this.#props.align,
      ...getTransitionFlags(input.status),
    };
  }

  getPopupAttrs(_state: TooltipState) {
    return {
      popover: 'manual' as const,
      role: 'presentation' as const,
    };
  }
}

/** @internal */
export namespace TooltipCore {
  export type Props = TooltipCoreProps;
  export type State = TooltipState;
  export type Input = TooltipInput;
}

import { defaults } from '@videojs/utils/object';
import type { NonNullableObject } from '@videojs/utils/types';

export interface TooltipGroupProps {
  /** Default open delay in ms for tooltips in this group. */
  delay?: number | undefined;
  /** Default close delay in ms for tooltips in this group. */
  closeDelay?: number | undefined;
  /** Duration in ms after a tooltip closes during which the next tooltip opens instantly. */
  timeout?: number | undefined;
}

/** @internal */
export class TooltipGroupCore {
  static readonly defaultProps: NonNullableObject<TooltipGroupProps> = {
    delay: 600,
    closeDelay: 0,
    timeout: 400,
  };

  #props = { ...TooltipGroupCore.defaultProps };
  #lastCloseTime = 0;
  #isOpen = false;

  constructor(props?: TooltipGroupProps) {
    if (props) this.setProps(props);
  }

  setProps(props: TooltipGroupProps): void {
    this.#props = defaults(props, TooltipGroupCore.defaultProps);
  }

  get delay(): number {
    return this.#props.delay;
  }

  get closeDelay(): number {
    return this.#props.closeDelay;
  }

  shouldSkipDelay(): boolean {
    if (this.#isOpen) return true;

    return Date.now() - this.#lastCloseTime < this.#props.timeout;
  }

  notifyOpen(): void {
    this.#isOpen = true;
  }

  notifyClose(): void {
    this.#isOpen = false;
    this.#lastCloseTime = Date.now();
  }
}

/** @internal */
export namespace TooltipGroupCore {
  export type Props = TooltipGroupProps;
}

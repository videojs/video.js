import { TooltipGroupCore, type TooltipGroupProps } from '@videojs/core';
import type { PropertyDeclarationMap, PropertyValues } from '@videojs/element';
import { ContextProvider } from '@videojs/element/context';

import { UIElement } from '../ui-element';
import { tooltipGroupContext } from './context';

export class TooltipGroupElement extends UIElement {
  static readonly tagName = 'media-tooltip-group';

  static override properties = {
    delay: { type: Number },
    closeDelay: { type: Number, attribute: 'close-delay' },
    timeout: { type: Number },
  } satisfies PropertyDeclarationMap<keyof TooltipGroupProps>;

  delay = TooltipGroupCore.defaultProps.delay;
  closeDelay = TooltipGroupCore.defaultProps.closeDelay;
  timeout = TooltipGroupCore.defaultProps.timeout;

  readonly #core = new TooltipGroupCore();
  readonly #provider = new ContextProvider(this, { context: tooltipGroupContext, initialValue: this.#core });

  protected override update(_changed: PropertyValues): void {
    super.update(_changed);
    this.#core.setProps(this);
    this.#provider.setValue(this.#core);
  }
}

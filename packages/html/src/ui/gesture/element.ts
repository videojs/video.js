import type { GestureProps } from '@videojs/core';
import {
  createDoubleTapGesture,
  createTapGesture,
  getGestureActionValue,
  resolveGestureAction,
} from '@videojs/core/dom';
import type { PropertyDeclarationMap, PropertyValues } from '@videojs/element';
import { ContextConsumer } from '@videojs/element/context';

import { containerContext, playerContext } from '../../player/context';
import { PlayerController } from '../../player/controller';
import { UIElement } from '../ui-element';

export class GestureElement extends UIElement {
  static readonly tagName = 'media-gesture';

  static override properties: PropertyDeclarationMap = {
    type: { type: String },
    action: { type: String },
    value: { type: Number },
    pointer: { type: String },
    region: { type: String },
    disabled: { type: Boolean },
  };

  type: GestureProps['type'] | '' = '';
  action: GestureProps['action'] = '';
  value: GestureProps['value'] = undefined;
  pointer: GestureProps['pointer'] = undefined;
  region: GestureProps['region'] = undefined;
  disabled: NonNullable<GestureProps['disabled']> = false;

  readonly #player = new PlayerController(this, playerContext);
  readonly #container = new ContextConsumer(this, {
    context: containerContext,
    callback: () => this.requestUpdate(),
    subscribe: true,
  });
  #cleanup: (() => void) | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.style.display = 'none';
    this.#register();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#unregister();
  }

  protected override update(changed: PropertyValues): void {
    super.update(changed);

    // Re-register when attributes change.
    if (this.isConnected) {
      this.#unregister();
      this.#register();
    }
  }

  #register(): void {
    const store = this.#player.value;
    const container = this.#container.value?.container;
    if (!this.type || !this.action || !store || !container) return;

    const resolver = resolveGestureAction(this.action);
    if (!resolver) return;

    const { value, region } = this;
    const actionValue = getGestureActionValue(this.action, region, value);

    const onActivate = (event: PointerEvent) => {
      resolver({ store, value: actionValue, event });
    };

    const options = {
      pointer: this.pointer,
      region,
      disabled: this.disabled,
      action: this.action,
      value: actionValue,
    };

    if (this.type === 'doubletap') {
      this.#cleanup = createDoubleTapGesture(container, onActivate, options);
    } else if (this.type === 'tap') {
      this.#cleanup = createTapGesture(container, onActivate, options);
    }
  }

  #unregister(): void {
    this.#cleanup?.();
    this.#cleanup = null;
  }
}

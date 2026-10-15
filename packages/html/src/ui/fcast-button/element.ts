import { applyElementProps, createButton } from '@videojs/core/dom';
import type { PropertyDeclarationMap, PropertyValues } from '@videojs/element';
import { ContextConsumer } from '@videojs/element/context';
import { FCastExtension } from '@videojs/fcast';

import { extensionContext, type ExtensionContextValue } from '../../player/context';
import { UIElement } from '../ui-element';

/** FCast control that observes the surrounding player’s opt-in FCast extension. @experimental */
export class FCastButtonElement extends UIElement {
  static readonly tagName = 'media-fcast-button';

  static override properties = {
    disabled: { type: Boolean },
  } satisfies PropertyDeclarationMap;

  disabled = false;
  #controller: AbortController | null = null;

  #extension: FCastExtension | undefined;
  #unsubscribe: (() => void) | undefined;
  #onChange = () => this.requestUpdate();

  constructor() {
    super();
    new ContextConsumer(this, {
      context: extensionContext,
      subscribe: true,
      callback: (value) => this.#observe(value.extensions),
    });
  }

  #observe(extensions: ExtensionContextValue['extensions']): void {
    this.#unsubscribe?.();
    const sync = () => {
      this.#extension?.removeEventListener('change', this.#onChange);
      this.#extension = extensions.get(FCastExtension);
      this.#extension?.addEventListener('change', this.#onChange);
      this.requestUpdate();
    };

    this.#unsubscribe = extensions.subscribe(sync);
    sync();
  }

  override connectedCallback(): void {
    super.connectedCallback();

    if (this.destroyed) return;

    this.#controller = new AbortController();
    applyElementProps(
      this,
      createButton({
        isDisabled: () => this.#isDisabled(),
        onActivate: () => {
          void this.#extension?.toggle().catch((error: unknown) => {
            if (__DEV__) console.error('[media-fcast-button]', error);
          });
        },
      }),
      { signal: this.#controller.signal }
    );
  }

  override disconnectedCallback(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = undefined;
    this.#extension?.removeEventListener('change', this.#onChange);
    this.#extension = undefined;
    this.#controller?.abort();
    this.#controller = null;
    super.disconnectedCallback();
  }

  protected override update(changed: PropertyValues): void {
    super.update(changed);

    const { availability = 'unsupported', connection = 'disconnected', deviceName } = this.#extension?.snapshot ?? {};
    const label =
      connection === 'connected'
        ? `Disconnect from ${deviceName ?? 'FCast'}`
        : connection === 'connecting'
          ? 'Connecting to FCast'
          : 'Cast with FCast';

    applyElementProps(this, {
      'aria-label': label,
      'aria-disabled': this.#isDisabled() ? 'true' : undefined,
      hidden:
        !this.#extension?.sender || (availability === 'unsupported' && connection !== 'connected') ? '' : undefined,
      'data-hidden':
        !this.#extension?.sender || (availability === 'unsupported' && connection !== 'connected') ? '' : undefined,
      'data-fcast-state': connection,
      'data-availability': availability,
    });
  }

  #isDisabled(): boolean {
    const { availability, connection } = this.#extension?.snapshot ?? {};

    return (
      this.disabled ||
      !this.#extension?.enabled ||
      connection === 'connecting' ||
      (connection !== 'connected' && availability !== 'available')
    );
  }
}

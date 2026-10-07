import { applyElementProps, createButton } from '@videojs/core/dom';
import type { PropertyDeclarationMap, PropertyValues } from '@videojs/element';
import { FCastExtension, type FCastSender } from '@videojs/fcast';

import { PlayerExtensionElement } from '../../extensions/player-extension-element';

/** FCast control that registers a sender-backed player extension beside the Cast and AirPlay buttons. @experimental */
export class FCastButtonElement extends PlayerExtensionElement<FCastExtension> {
  static readonly tagName = 'media-fcast-button';

  static override properties = {
    src: { type: String },
    contentType: { type: String, attribute: 'content-type' },
    disabled: { type: Boolean },
  } satisfies PropertyDeclarationMap;

  disabled = false;
  #controller: AbortController | null = null;

  protected createExtension(): FCastExtension {
    const extension = new FCastExtension();

    extension.addEventListener('change', () => this.requestUpdate());
    return extension;
  }

  protected override get shouldRegisterExtension(): boolean {
    return !!this.sender;
  }

  get sender(): FCastSender | undefined {
    return this.extension.sender;
  }

  set sender(value: FCastSender | undefined) {
    this.extension.sender = value;
    this.refreshExtensionRegistration();
    this.requestUpdate();
  }

  get src(): string {
    return this.extension.src;
  }

  set src(value: string | null | undefined) {
    this.extension.src = value ?? undefined;
  }

  get contentType(): string | undefined {
    return this.extension.contentType;
  }

  set contentType(value: string | null | undefined) {
    this.extension.contentType = value ?? undefined;
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
          void this.extension.toggle().catch((error: unknown) => {
            if (__DEV__) console.error('[media-fcast-button]', error);
          });
        },
      }),
      { signal: this.#controller.signal }
    );
  }

  override disconnectedCallback(): void {
    this.#controller?.abort();
    this.#controller = null;
    super.disconnectedCallback();
  }

  protected override update(changed: PropertyValues): void {
    super.update(changed);

    const { availability, connection, deviceName } = this.extension.snapshot;
    const label =
      connection === 'connected'
        ? `Disconnect from ${deviceName ?? 'FCast'}`
        : connection === 'connecting'
          ? 'Connecting to FCast'
          : 'Cast with FCast';

    applyElementProps(this, {
      'aria-label': label,
      'aria-disabled': this.#isDisabled() ? 'true' : undefined,
      hidden: !this.sender || (availability === 'unsupported' && connection !== 'connected') ? '' : undefined,
      'data-hidden': !this.sender || (availability === 'unsupported' && connection !== 'connected') ? '' : undefined,
      'data-fcast-state': connection,
      'data-availability': availability,
    });
  }

  #isDisabled(): boolean {
    const { availability, connection } = this.extension.snapshot;

    return (
      this.disabled ||
      !this.extension.enabled ||
      connection === 'connecting' ||
      (connection !== 'connected' && availability !== 'available')
    );
  }
}

import type { PlayerExtension } from '@videojs/core/dom';
import { ContextConsumer } from '@videojs/element/context';

import { type ExtensionContextValue, extensionContext } from '../player/context';
import { UIElement } from '../ui/ui-element';
import {
  METADATA_ATTRIBUTE_PREFIX,
  extensionMetadataEqual,
  mergeExtensionMetadata,
  readMetadataAttributes,
} from './metadata-attributes';

/**
 * Abstract base for elements that register a player extension (e.g. Mux Data, Google Cast) with the surrounding player.
 *
 * Place anywhere inside a player. The extension is registered when the element connects, follows the player's media
 * (plain `<video>` / `<audio>` included) through the player itself, is released when this element disconnects, and is
 * destroyed with this element.
 */
export abstract class PlayerExtensionElement<Extension extends object> extends UIElement {
  #extension: (Extension & PlayerExtension) | null = null;
  #register: ExtensionContextValue['registerExtension'] | null = null;
  #release: (() => void) | null = null;
  #metadataFromProperty: Record<string, unknown> | undefined;
  #metadataAttributeWritesHooked = false;

  /**
   * Create the player extension this element registers. Called once, lazily.
   *
   * Must be a method rather than a field: upgrading an element that is already in the document runs its constructor
   * while connected, so the context callback below can fire before subclass field initializers have run.
   *
   * @internal Returning a `PlayerExtension` is what checks that the extension conforms, without making the player
   *   extension contract part of every element's public types.
   */
  protected abstract createExtension(): Extension & PlayerExtension;

  /** The player extension instance registered with the player. */
  protected get extension(): Extension {
    return this.#getExtension();
  }

  constructor() {
    super();
    // Registers itself as a controller on this element; re-requests on reconnect.
    new ContextConsumer(this, {
      context: extensionContext,
      subscribe: true,
      callback: (value) => this.#setRegister(value.registerExtension),
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.#hookMetadataAttributeWrites();
    this.#pushMetadataToExtension();
  }

  override disconnectedCallback(): void {
    // Release while the player is still live so the extension can clean up against the real media.
    this.#setRegister(null);
    super.disconnectedCallback();
  }

  override destroyCallback(): void {
    this.#setRegister(null);
    // Don't create an extension just to destroy it.
    this.#extension?.destroy?.();
    super.destroyCallback();
  }

  /**
   * Merged metadata the element forwards to its extension: `metadata-*` attributes plus any `metadata` property, with
   * the property overriding attribute keys.
   *
   * @internal
   */
  protected getResolvedMetadata(): Record<string, unknown> | undefined {
    return mergeExtensionMetadata(readMetadataAttributes(this), this.#metadataFromProperty);
  }

  /**
   * Stores programmatic `metadata` and refreshes the registered extension.
   *
   * @internal
   */
  protected setMetadataFromProperty(value: Record<string, unknown> | undefined): void {
    this.#metadataFromProperty = value;
    this.#pushMetadataToExtension();
  }

  #setRegister(register: ExtensionContextValue['registerExtension'] | null): void {
    if (this.#register === register) return;

    this.#release?.();
    this.#release = null;
    this.#register = register;

    if (register) {
      this.#release = register(this.#getExtension());
      this.#pushMetadataToExtension();
    }
  }

  #getExtension(): Extension & PlayerExtension {
    if (this.#extension) return this.#extension;

    const extension = this.createExtension();

    this.#extension = extension;
    this.#pushMetadataToExtension();

    return extension;
  }

  #pushMetadataToExtension(): void {
    const extension = this.#extension;
    if (!extension || !('metadata' in extension)) return;

    const target = extension as { metadata?: Record<string, unknown> | undefined };
    const next = this.getResolvedMetadata();
    if (extensionMetadataEqual(next, target.metadata)) return;

    target.metadata = next;
  }

  #hookMetadataAttributeWrites(): void {
    if (this.#metadataAttributeWritesHooked) return;

    this.#metadataAttributeWritesHooked = true;

    const element = this as HTMLElement;
    const setAttribute = element.setAttribute.bind(element);
    const removeAttribute = element.removeAttribute.bind(element);

    element.setAttribute = (name, value) => {
      setAttribute(name, value);

      if (name.startsWith(METADATA_ATTRIBUTE_PREFIX)) this.#pushMetadataToExtension();
    };
    element.removeAttribute = (name) => {
      removeAttribute(name);

      if (name.startsWith(METADATA_ATTRIBUTE_PREFIX)) this.#pushMetadataToExtension();
    };
  }
}

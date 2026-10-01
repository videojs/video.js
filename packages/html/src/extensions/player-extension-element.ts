import type { PlayerExtension } from '@videojs/core/dom';
import { ContextConsumer } from '@videojs/element/context';

import { type ExtensionContextValue, extensionContext } from '../player/context';
import { UIElement } from '../ui/ui-element';

/**
 * Abstract base for elements that register a player extension (e.g. Mux Data, Google Cast) with the surrounding player.
 *
 * Place anywhere inside a player. The extension is registered when the element connects, follows the player's media
 * (plain `<video>` / `<audio>` included) through the player itself, is released when this element disconnects, and is
 * destroyed with this element.
 */
export abstract class PlayerExtensionElement<Extension extends PlayerExtension> extends UIElement {
  #extension: Extension | null = null;
  #register: ExtensionContextValue['registerExtension'] | null = null;
  #release: (() => void) | null = null;

  /**
   * Create the player extension this element registers. Called once, lazily.
   *
   * Must be a method rather than a field: upgrading an element that is already in the document runs its constructor
   * while connected, so the context callback below can fire before subclass field initializers have run.
   */
  protected abstract createExtension(): Extension;

  /** The player extension instance registered with the player. */
  protected get extension(): Extension {
    return (this.#extension ??= this.createExtension());
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

  #setRegister(register: ExtensionContextValue['registerExtension'] | null): void {
    if (this.#register === register) return;

    this.#release?.();
    this.#release = null;
    this.#register = register;

    if (register) this.#release = register(this.extension);
  }
}

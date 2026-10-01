import type { PlayerExtension } from '@videojs/core/dom';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { PlayerExtensionElement } from '../player-extension-element';
import { TestExtensionProvider } from './test-utils';

class FakeExtension implements PlayerExtension {
  destroyed = false;
  destroy() {
    this.destroyed = true;
  }
}

class TestPlayerExtensionElement extends PlayerExtensionElement<FakeExtension> {
  static readonly tagName = 'test-player-extension';

  /**
   * Subclass field initializers run after the base constructor, which is the window the context callback can fire in
   * during a custom element upgrade. Reading the extension here proves it resolves that early.
   */
  readonly extensionDuringFieldInit = this.extension;

  /** Exposes the protected extension for assertions. */
  get instance(): FakeExtension {
    return this.extension;
  }

  protected createExtension(): FakeExtension {
    return new FakeExtension();
  }
}

customElements.define('test-player-extension-provider', TestExtensionProvider);
customElements.define(TestPlayerExtensionElement.tagName, TestPlayerExtensionElement);

function setup() {
  const provider = new TestExtensionProvider();
  const el = new TestPlayerExtensionElement();

  provider.append(el);
  document.body.append(provider);

  return { provider, el };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('PlayerExtensionElement', () => {
  it('resolves the extension before subclass fields initialize', () => {
    const el = new TestPlayerExtensionElement();

    expect(el.extensionDuringFieldInit).toBeInstanceOf(FakeExtension);
    // Created once and reused, not re-created per access.
    expect(el.extensionDuringFieldInit).toBe(el.instance);
  });

  it('registers the extension with the player from context', () => {
    const { provider, el } = setup();

    expect(provider.extensions.get(FakeExtension)).toBe(el.instance);
  });

  it('registers when parsed into a connected player', () => {
    const provider = new TestExtensionProvider();

    document.body.append(provider);
    provider.innerHTML = `<${TestPlayerExtensionElement.tagName}></${TestPlayerExtensionElement.tagName}>`;

    expect(provider.extensions.get(FakeExtension)).toBeInstanceOf(FakeExtension);
  });

  it('releases the extension on disconnect and registers it again on reconnect', () => {
    const { provider, el } = setup();

    el.remove();
    expect(provider.extensions.get(FakeExtension)).toBeUndefined();
    expect(el.instance.destroyed).toBe(false);

    provider.append(el);
    expect(provider.extensions.get(FakeExtension)).toBe(el.instance);
  });

  it('destroys the extension when the element is destroyed', () => {
    const { provider, el } = setup();

    el.destroy();

    expect(el.instance.destroyed).toBe(true);
    expect(provider.extensions.get(FakeExtension)).toBeUndefined();
  });

  it('does not create an extension when destroyed before use', () => {
    // `extensionDuringFieldInit` already forced creation, so assert through a
    // subclass that never touches it.
    class Untouched extends PlayerExtensionElement<FakeExtension> {
      created = 0;
      protected createExtension(): FakeExtension {
        this.created++;
        return new FakeExtension();
      }
    }

    customElements.define('test-player-extension-untouched', Untouched);

    const el = new Untouched();

    el.destroy();

    expect(el.created).toBe(0);
  });
});

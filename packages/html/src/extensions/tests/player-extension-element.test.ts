import type { PlayerExtension } from '@videojs/core/dom';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { PlayerExtensionElement } from '../player-extension-element';
import { TestExtensionProvider } from './test-utils';

class FakeExtension implements PlayerExtension {
  destroyed = false;
  metadata: Record<string, unknown> | undefined = undefined;

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

  it('forwards metadata-* attributes to extensions that expose metadata', async () => {
    const { provider, el } = setup();

    el.setAttribute('metadata-video-title', 'From attribute');
    // MutationObserver fires on microtask.
    await Promise.resolve();

    expect(el.instance.metadata).toEqual({ video_title: 'From attribute' });
    expect(provider.extensions.get(FakeExtension)).toBe(el.instance);
  });

  it('forwards metadata-* attributes when parsed into a player', () => {
    const provider = new TestExtensionProvider();

    document.body.append(provider);
    provider.innerHTML = `<${TestPlayerExtensionElement.tagName} metadata-video-title="From attribute"></${TestPlayerExtensionElement.tagName}>`;

    const instance = provider.extensions.get(FakeExtension)!;

    expect(instance.metadata).toEqual({ video_title: 'From attribute' });
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

  it('updates metadata when attributes change via toggleAttribute', async () => {
    const { el } = setup();

    el.toggleAttribute('metadata-live', true);
    // MutationObserver fires on microtask.
    await Promise.resolve();

    expect(el.instance.metadata).toEqual({ live: '' });
  });

  it('updates metadata when attributes change via setAttributeNS', async () => {
    const { el } = setup();

    el.setAttributeNS(null, 'metadata-video-title', 'Via NS');
    await Promise.resolve();

    expect(el.instance.metadata).toEqual({ video_title: 'Via NS' });
  });

  it('updates metadata when attributes change via removeAttributeNode', async () => {
    const { el } = setup();

    el.setAttribute('metadata-video-title', 'Initial');
    await Promise.resolve();

    const attr = el.getAttributeNode('metadata-video-title')!;

    el.removeAttributeNode(attr);
    await Promise.resolve();

    expect(el.instance.metadata).toBeUndefined();
  });

  it('updates metadata when attributes change via setAttributeNode', async () => {
    const { el } = setup();

    const attr = document.createAttribute('metadata-video-title');

    attr.value = 'Via Attr Node';

    el.setAttributeNode(attr);
    await Promise.resolve();

    expect(el.instance.metadata).toEqual({ video_title: 'Via Attr Node' });
  });

  it('does not push metadata to extensions without a metadata property', async () => {
    class NoMetadataExtension implements PlayerExtension {
      destroyed = false;

      destroy() {
        this.destroyed = true;
      }
    }

    class NoMetadataElement extends PlayerExtensionElement<NoMetadataExtension> {
      static readonly tagName = 'test-no-metadata-ext';

      get instance(): NoMetadataExtension {
        return this.extension;
      }

      protected createExtension(): NoMetadataExtension {
        return new NoMetadataExtension();
      }
    }

    customElements.define(NoMetadataElement.tagName, NoMetadataElement);

    const provider = new TestExtensionProvider();
    const el = new NoMetadataElement();

    provider.append(el);
    document.body.append(provider);

    el.setAttribute('metadata-video-title', 'Ignored');
    await Promise.resolve();

    expect('metadata' in el.instance).toBe(false);
  });
});

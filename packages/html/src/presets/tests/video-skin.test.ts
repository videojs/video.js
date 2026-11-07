import { FCastExtension as FCastCore, type FCastSender, type FCastSnapshot } from '@videojs/fcast';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { FCastExtension } from '../../define/extensions/fcast';
import '../../define/ui/fcast-button';
import { TestExtensionProvider } from '../../extensions/tests/test-utils';
import { template as videoTemplate } from '../../internal/skins/default-video/template';
import { FCastButtonElement } from '../../ui/fcast-button/element';
import { SkinElement } from '../skin';

customElements.define('test-skin-extension-provider', TestExtensionProvider);

let tagId = 0;

afterEach(() => {
  document.body.replaceChildren();
  document.getElementById('__media-styles')?.remove();
});

describe('SkinElement', () => {
  it('observes a sibling FCast extension across the skin shadow root', async () => {
    const tag = `test-fcast-video-skin-${tagId++}`;

    customElements.define(
      tag,
      class extends SkinElement {
        static template = videoTemplate;
      }
    );
    const skin = document.createElement(tag);
    if (!(skin instanceof SkinElement)) throw new Error(`Failed to create ${tag}`);

    const button = skin.shadowRoot?.querySelector('media-fcast-button');

    expect(button).not.toBeNull();

    if (!(button instanceof FCastButtonElement)) throw new Error('FCast button is not registered');

    const snapshot: FCastSnapshot = {
      availability: 'available',
      connection: 'disconnected',
      playbackState: 'idle',
      paused: true,
      currentTime: 0,
      duration: 0,
      volume: 1,
      muted: false,
      speed: 1,
    };
    const sender = Object.assign(new EventTarget(), {
      snapshot,
      prompt: async () => {},
      disconnect: async () => {},
      load: async () => {},
      play: async () => {},
      pause: async () => {},
      seek: async () => {},
      setVolume: async () => {},
      setSpeed: async () => {},
    }) satisfies FCastSender;

    const provider = new TestExtensionProvider();
    const extension = new FCastExtension();

    extension.sender = sender;
    provider.append(skin);
    document.body.append(provider);
    await button.updateComplete;

    expect(button.hidden).toBe(true);
    expect(provider.extensions.get(FCastCore)).toBeUndefined();

    provider.append(extension);
    await button.updateComplete;

    expect(button.hidden).toBe(false);
    expect(provider.extensions.get(FCastCore)?.sender).toBe(sender);

    extension.remove();
    await button.updateComplete;
    expect(button.hidden).toBe(true);
  });
});

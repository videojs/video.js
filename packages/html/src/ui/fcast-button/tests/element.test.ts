import { FCastExtension, type FCastLoadRequest, type FCastSender, type FCastSnapshot } from '@videojs/fcast';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { FCastExtension as FCastExtensionElement } from '../../../extensions/fcast';
import { TestExtensionProvider } from '../../../extensions/tests/test-utils';
import { TooltipElement } from '../../tooltip/element';
import { TooltipLabelElement } from '../../tooltip/label';
import { TooltipShortcutElement } from '../../tooltip/shortcut';
import { FCastButtonElement } from '../element';

class TestSender extends EventTarget implements FCastSender {
  snapshot: FCastSnapshot = {
    availability: 'available',
    connection: 'disconnected',
    paused: true,
    currentTime: 0,
    duration: 0,
    volume: 1,
    muted: false,
    speed: 1,
  };
  prompt = vi.fn(async () => {});
  disconnect = vi.fn(async () => {});
  load = vi.fn(async (_request: FCastLoadRequest) => {});
  play = vi.fn(async () => {});
  pause = vi.fn(async () => {});
  seek = vi.fn(async (_time: number) => {});
  setVolume = vi.fn(async (_volume: number) => {});
  setSpeed = vi.fn(async (_speed: number) => {});
}

customElements.define('test-fcast-provider', TestExtensionProvider);
customElements.define('test-fcast-button', FCastButtonElement);
customElements.define('test-fcast-extension', FCastExtensionElement);
customElements.define('test-fcast-tooltip', TooltipElement);
customElements.define(TooltipLabelElement.tagName, TooltipLabelElement);
customElements.define(TooltipShortcutElement.tagName, TooltipShortcutElement);

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FCastButtonElement', () => {
  it('reflects sender availability and activates its picker', async () => {
    const provider = new TestExtensionProvider();
    const button = new FCastButtonElement();
    const sender = new TestSender();

    provider.append(button);
    document.body.append(provider);
    provider.extensions.attach({ media: document.createElement('video'), container: null });
    await button.updateComplete;

    expect(button.hidden).toBe(true);
    expect(button.hasAttribute('data-hidden')).toBe(true);
    expect(provider.extensions.get(FCastExtension)).toBeUndefined();

    const extension = new FCastExtensionElement();

    extension.sender = sender;
    provider.append(extension);
    await button.updateComplete;

    const tooltip = new TooltipElement();

    tooltip.id = 'fcast-tooltip';
    button.setAttribute('commandfor', tooltip.id);
    provider.append(tooltip);
    await tooltip.updateComplete;

    expect(button.getAttribute('aria-label')).toBe('Cast with FCast');
    expect(TooltipLabelElement.findIn(tooltip)?.textContent).toBe('Cast with FCast');
    expect(button.hidden).toBe(false);
    expect(button.hasAttribute('data-hidden')).toBe(false);
    expect(button.getAttribute('data-availability')).toBe('available');
    expect(provider.extensions.get(FCastExtension)?.enabled).toBe(true);
    expect(button.getAttribute('aria-disabled')).toBeNull();

    button.click();
    expect(sender.prompt).toHaveBeenCalledOnce();

    const core = provider.extensions.get(FCastExtension);

    button.remove();
    expect(provider.extensions.get(FCastExtension)).toBe(core);
    provider.append(button);
    await button.updateComplete;
    expect(button.hidden).toBe(false);

    extension.src = 'https://example.com/remote.m3u8';
    extension.contentType = 'application/x-mpegURL';
    expect(core?.src).toBe('https://example.com/remote.m3u8');
    expect(core?.contentType).toBe('application/x-mpegURL');

    sender.snapshot = { ...sender.snapshot, availability: 'unsupported', connection: 'connected' };
    sender.dispatchEvent(new Event('change'));
    await button.updateComplete;

    expect(button.hidden).toBe(false);
    expect(button.getAttribute('aria-label')).toBe('Disconnect from FCast');
    expect(TooltipLabelElement.findIn(tooltip)?.textContent).toBe('Disconnect from FCast');

    extension.remove();
    await button.updateComplete;
    expect(provider.extensions.get(FCastExtension)).toBeUndefined();
    expect(button.hidden).toBe(true);
  });
});

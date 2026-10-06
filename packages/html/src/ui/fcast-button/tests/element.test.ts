import { FCastExtension, type FCastLoadRequest, type FCastSender, type FCastSnapshot } from '@videojs/fcast';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { TestExtensionProvider } from '../../../extensions/tests/test-utils';
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

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FCastButtonElement', () => {
  it('reflects sender availability and activates its picker', async () => {
    const provider = new TestExtensionProvider();
    const button = new FCastButtonElement();
    const sender = new TestSender();

    button.sender = sender;
    provider.append(button);
    document.body.append(provider);
    provider.extensions.attach({ media: document.createElement('video'), container: null });
    await button.updateComplete;

    expect(button.getAttribute('aria-label')).toBe('Cast with FCast');
    expect(button.getAttribute('data-availability')).toBe('available');
    expect(provider.extensions.get(FCastExtension)?.enabled).toBe(true);
    expect(button.getAttribute('aria-disabled')).toBeNull();

    button.click();
    expect(sender.prompt).toHaveBeenCalledOnce();

    sender.snapshot = { ...sender.snapshot, availability: 'unsupported', connection: 'connected' };
    sender.dispatchEvent(new Event('change'));
    await button.updateComplete;

    expect(button.hidden).toBe(false);
    expect(button.getAttribute('aria-label')).toBe('Disconnect from FCast');
  });
});

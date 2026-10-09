import { act, fireEvent, render, screen } from '@testing-library/react';
import { FCastExtension, type FCastLoadRequest, type FCastSender, type FCastSnapshot } from '@videojs/fcast';
import { describe, expect, it, vi } from 'vite-plus/test';

import { createPlayerWrapper } from '../../../testing/mocks';
import { FCastButton } from '../component';

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
  prompt = vi.fn(async () => {
    this.snapshot = { ...this.snapshot, connection: 'connected', deviceName: 'Living room' };
    this.dispatchEvent(new Event('change'));
  });
  disconnect = vi.fn(async () => {});
  load = vi.fn(async (_request: FCastLoadRequest) => {});
  play = vi.fn(async () => {});
  pause = vi.fn(async () => {});
  seek = vi.fn(async (_time: number) => {});
  setVolume = vi.fn(async (_volume: number) => {});
  setSpeed = vi.fn(async (_speed: number) => {});
}

describe('FCastButton', () => {
  it('shows its own FCast state and invokes the sender picker', async () => {
    const { Wrapper, extensions } = createPlayerWrapper();
    const sender = new TestSender();

    render(<FCastButton sender={sender}>FCast</FCastButton>, { wrapper: Wrapper });
    act(() => extensions.attach({ media: document.createElement('video'), container: null }));

    const button = screen.getByRole('button', { name: 'Cast with FCast' });

    expect(extensions.get(FCastExtension)?.enabled).toBe(true);
    expect(button.getAttribute('aria-disabled')).toBeNull();
    fireEvent.click(button);

    expect(sender.prompt).toHaveBeenCalledOnce();
    expect(
      (await screen.findByRole('button', { name: 'Disconnect from Living room' })).getAttribute('data-fcast-state')
    ).toBe('connected');

    act(() => {
      sender.snapshot = { ...sender.snapshot, availability: 'unsupported' };
      sender.dispatchEvent(new Event('change'));
    });
    expect(screen.getByRole('button', { name: 'Disconnect from Living room' })).toBeDefined();
  });
});

import { act, fireEvent, render, screen } from '@testing-library/react';
import { FCastExtension, type FCastLoadRequest, type FCastSender, type FCastSnapshot } from '@videojs/fcast';
import { describe, expect, it, vi } from 'vite-plus/test';

import { FCast } from '../../../extensions/fcast';
import { createPlayerWrapper } from '../../../testing/mocks';
import { Tooltip } from '../../tooltip';
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
  it('does not create an extension when rendered alone', () => {
    const { Wrapper, extensions } = createPlayerWrapper();

    render(<FCastButton />, { wrapper: Wrapper });

    expect(extensions.get(FCastExtension)).toBeUndefined();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('leaves the extension active when a control unmounts and synchronizes configuration', () => {
    const { Wrapper, extensions } = createPlayerWrapper();
    const sender = new TestSender();
    const replacement = new TestSender();
    const view = render(
      <>
        <FCast sender={sender} />
        <FCastButton />
      </>,
      { wrapper: Wrapper }
    );
    const extension = extensions.get(FCastExtension);

    view.rerender(
      <FCast sender={replacement} src="https://example.com/remote.m3u8" contentType="application/x-mpegURL" />
    );
    expect(extensions.get(FCastExtension)).toBe(extension);
    expect(extension?.sender).toBe(replacement);
    expect(extension?.src).toBe('https://example.com/remote.m3u8');
    expect(extension?.contentType).toBe('application/x-mpegURL');

    view.unmount();
    expect(extensions.get(FCastExtension)).toBeUndefined();
  });

  it('shows its own FCast state and invokes the sender picker', async () => {
    const { Wrapper, extensions } = createPlayerWrapper();
    const sender = new TestSender();

    const view = render(
      <>
        <Tooltip.Root defaultOpen>
          <Tooltip.Trigger render={<FCastButton>FCast</FCastButton>} />
          <Tooltip.Popup>
            <Tooltip.Label data-testid="fcast-tooltip-label" />
          </Tooltip.Popup>
        </Tooltip.Root>
        <FCast sender={sender} />
      </>,
      { wrapper: Wrapper }
    );

    act(() => extensions.attach({ media: document.createElement('video'), container: null }));

    const button = screen.getByRole('button', { name: 'Cast with FCast' });

    expect(screen.getByTestId('fcast-tooltip-label').textContent).toBe('Cast with FCast');
    expect(extensions.get(FCastExtension)?.enabled).toBe(true);
    expect(button.getAttribute('aria-disabled')).toBeNull();
    fireEvent.click(button);

    expect(sender.prompt).toHaveBeenCalledOnce();
    expect(
      (await screen.findByRole('button', { name: 'Disconnect from Living room' })).getAttribute('data-fcast-state')
    ).toBe('connected');
    expect(screen.getByTestId('fcast-tooltip-label').textContent).toBe('Disconnect from Living room');

    act(() => {
      sender.snapshot = { ...sender.snapshot, availability: 'unsupported' };
      sender.dispatchEvent(new Event('change'));
    });
    expect(screen.getByRole('button', { name: 'Disconnect from Living room' })).toBeDefined();

    view.rerender(<FCastButton>FCast</FCastButton>);
    expect(extensions.get(FCastExtension)).toBeUndefined();
    expect(screen.queryByRole('button')).toBeNull();
  });
});

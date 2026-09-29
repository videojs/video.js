import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { VolumePopover } from '..';
import { createPlayerWrapper } from '../../../testing/mocks';
import { MuteButton } from '../../mute-button/component';

const availableVolume = {
  volume: 1,
  muted: false,
  volumeAvailability: 'available',
  mutedAvailability: 'available',
  setVolume: () => 1,
  setMuted: () => false,
};

afterEach(cleanup);

describe('VolumePopover', () => {
  it('opens its popup when volume level controls are available', async () => {
    const { Wrapper } = createPlayerWrapper(availableVolume);

    render(
      <Wrapper>
        <VolumePopover.Root>
          <VolumePopover.Trigger
            render={
              <button type="button" data-testid="trigger">
                Volume
              </button>
            }
          />
          <VolumePopover.Popup data-testid="popup">Slider</VolumePopover.Popup>
        </VolumePopover.Root>
      </Wrapper>
    );

    fireEvent.click(screen.getByTestId('trigger'));

    await waitFor(() => {
      expect(screen.getByTestId('popup').getAttribute('data-availability')).toBe('available');
      expect(screen.getByTestId('trigger').getAttribute('aria-expanded')).toBe('true');
    });
  });

  it.each(['unavailable', 'unsupported'] as const)(
    'keeps only its trigger when volume level controls are %s',
    (volumeAvailability) => {
      const { Wrapper } = createPlayerWrapper({ ...availableVolume, volumeAvailability });

      render(
        <Wrapper>
          <VolumePopover.Root defaultOpen>
            <VolumePopover.Trigger data-testid="trigger" render={<MuteButton>Mute</MuteButton>} />
            <VolumePopover.Popup data-testid="popup">Slider</VolumePopover.Popup>
          </VolumePopover.Root>
        </Wrapper>
      );

      expect(screen.getByTestId('trigger').hasAttribute('aria-expanded')).toBe(false);
      expect(screen.queryByTestId('popup')).toBeNull();
    }
  );

  it('arms its trigger once volume level controls become available', async () => {
    const { Wrapper, store } = createPlayerWrapper({ ...availableVolume, volumeAvailability: 'unavailable' });

    render(
      <Wrapper>
        <VolumePopover.Root>
          <VolumePopover.Trigger data-testid="trigger" render={<MuteButton>Mute</MuteButton>} />
          <VolumePopover.Popup data-testid="popup">Slider</VolumePopover.Popup>
        </VolumePopover.Root>
      </Wrapper>
    );

    expect(screen.getByTestId('trigger').hasAttribute('aria-haspopup')).toBe(false);

    act(() => {
      store.state = availableVolume;
      // SAFETY: the mock store records each subscribe call's listener as its only argument.
      const subscriptions = store.subscribe.mock.calls as unknown as Array<[() => void]>;

      for (const [notify] of subscriptions) notify();
    });

    await waitFor(() => expect(screen.getByTestId('trigger').getAttribute('aria-haspopup')).toBe('dialog'));

    fireEvent.click(screen.getByTestId('trigger'));

    await waitFor(() => {
      expect(screen.getByTestId('trigger').getAttribute('aria-expanded')).toBe('true');
      expect(screen.queryByTestId('popup')).not.toBeNull();
    });
  });

  it('closes an open popup when volume level controls become unavailable', async () => {
    const { Wrapper, store } = createPlayerWrapper(availableVolume);

    render(
      <Wrapper>
        <VolumePopover.Root>
          <VolumePopover.Trigger
            render={
              <button type="button" data-testid="trigger">
                Volume
              </button>
            }
          />
          <VolumePopover.Popup data-testid="popup">Slider</VolumePopover.Popup>
        </VolumePopover.Root>
      </Wrapper>
    );

    fireEvent.click(screen.getByTestId('trigger'));
    await waitFor(() => expect(screen.queryByTestId('popup')).not.toBeNull());

    act(() => {
      store.state = { ...availableVolume, volumeAvailability: 'unsupported' };
      const subscriptions = store.subscribe.mock.calls as unknown as Array<[() => void]>;

      for (const [notify] of subscriptions) notify();
    });

    await waitFor(() => {
      expect(screen.queryByTestId('popup')).toBeNull();
      expect(screen.getByTestId('trigger').hasAttribute('aria-expanded')).toBe(false);
    });
  });
});

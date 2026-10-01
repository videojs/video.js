import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { createPlayerWrapper } from '../../../testing/mocks';
import { Menu } from '../../menu';
import { PlaybackRateButton } from '../../playback-rate-button';
import { usePlaybackRateOptions } from '../use-playback-rate-options';

afterEach(cleanup);

function renderPlaybackRateOptions({
  playbackRates = [0.5, 1, 1.5, 2],
  playbackRate = 1.5,
  setPlaybackRate = vi.fn(),
  formatRate,
}: {
  playbackRates?: readonly number[];
  playbackRate?: number;
  setPlaybackRate?: (rate: number) => void;
  formatRate?: (rate: number) => string;
} = {}) {
  const { Wrapper } = createPlayerWrapper({ playbackRates, playbackRate, setPlaybackRate });

  render(
    <Menu.Root defaultOpen align="center">
      <PlaybackRateTrigger formatRate={formatRate} />
      <Menu.Popup>
        <Menu.Content data-testid="content">
          <PlaybackRateRadioGroup formatRate={formatRate} />
        </Menu.Content>
      </Menu.Popup>
    </Menu.Root>,
    { wrapper: Wrapper }
  );

  return { setPlaybackRate };
}

function PlaybackRateRadioGroup({ formatRate }: { formatRate?: ((rate: number) => string) | undefined }): ReactNode {
  const state = usePlaybackRateOptions(formatRate ? { formatRate } : undefined);
  if (!state) return null;

  const { options, selectedLabel, setValue, value } = state;

  return (
    <>
      <span data-testid="selected-label">{selectedLabel}</span>
      <Menu.RadioGroup value={value} onValueChange={setValue} aria-label="Playback rate">
        {options.map((option) => (
          <Menu.RadioItem key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </Menu.RadioItem>
        ))}
      </Menu.RadioGroup>
    </>
  );
}

function PlaybackRateTrigger({ formatRate }: { formatRate?: ((rate: number) => string) | undefined }): ReactNode {
  const state = usePlaybackRateOptions(formatRate ? { formatRate } : undefined);
  if (!state) return null;

  return (
    <Menu.Trigger
      disabled={state.disabled}
      render={<PlaybackRateButton data-testid="trigger" render={<button type="button" />} />}
    />
  );
}

describe('usePlaybackRateOptions', () => {
  it('renders radio items from the available playback rates', () => {
    renderPlaybackRateOptions({ playbackRates: [1, 1.25, 1.5], playbackRate: 1.25 });

    expect(screen.getByRole('menuitemradio', { name: '1×' }).getAttribute('aria-checked')).toBe('false');
    expect(screen.getByRole('menuitemradio', { name: '1.25×' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('menuitemradio', { name: '1.5×' }).getAttribute('aria-checked')).toBe('false');
    expect(screen.getByTestId('selected-label').textContent).toBe('1.25×');
  });

  it('uses a custom rate formatter for items', () => {
    renderPlaybackRateOptions({
      playbackRate: 1,
      formatRate: (rate) => (rate === 1 ? 'Normal' : `${rate}×`),
    });

    expect(screen.getByRole('menuitemradio', { name: 'Normal' }).getAttribute('aria-checked')).toBe('true');
  });

  it('disables the trigger when there are no rates', () => {
    renderPlaybackRateOptions({ playbackRates: [] });

    const trigger = screen.getByTestId('trigger');

    expect(trigger.getAttribute('aria-disabled')).toBe('true');
  });
});

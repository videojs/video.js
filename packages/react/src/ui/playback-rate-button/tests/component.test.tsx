import { cleanup, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { PlayerContextProvider, type PlayerContextValue } from '../../../player/context';
import { createMockStore, createPlayerWrapper } from '../../../testing/mocks';
import { Hotkey } from '../../hotkey/component';
import { Menu } from '../../menu';
import { Tooltip } from '../../tooltip';
import { PlaybackRateButton } from '../component';

afterEach(cleanup);

const shortcutClassName = 'test-tooltip-shortcut';

function createContextValue(container: HTMLElement): PlayerContextValue {
  return {
    store: createMockStore({
      playbackRates: [0.5, 1, 1.5, 2],
      playbackRate: 1,
      playbackRateAvailability: 'available',
      setPlaybackRate: vi.fn(),
    }) as any,
    media: null,
    setMedia: vi.fn(),
    container,
    setContainer: vi.fn(),
  };
}

function Wrapper({ children, value }: { children: ReactNode; value: PlayerContextValue }) {
  return <PlayerContextProvider value={value}>{children}</PlayerContextProvider>;
}

describe('PlaybackRateButton', () => {
  it('renders a trigger with the current playback rate state', () => {
    const { Wrapper: PlayerWrapper } = createPlayerWrapper({
      playbackRate: 1.5,
      playbackRates: [0.5, 1, 1.5, 2],
      playbackRateAvailability: 'available',
      setPlaybackRate: vi.fn(),
    });

    render(
      <Menu.Root defaultOpen align="center">
        <Menu.Trigger render={<PlaybackRateButton data-testid="trigger" render={<button type="button" />} />} />
        <Menu.Popup>
          <Menu.Content>
            <Menu.Item>Speed</Menu.Item>
          </Menu.Content>
        </Menu.Popup>
      </Menu.Root>,
      { wrapper: PlayerWrapper }
    );

    const trigger = screen.getByTestId('trigger');

    expect(trigger.getAttribute('aria-label')).toBe('Playback rate, 1.5');
    expect(trigger.getAttribute('data-rate')).toBe('1.5');
  });

  it('renders nothing when the media has no playback rate', () => {
    // TikTok takes no speed command, so the control is removed rather than
    // rendered and inert.
    const { Wrapper: PlayerWrapper } = createPlayerWrapper({
      playbackRate: 1,
      playbackRates: [0.5, 1, 1.5, 2],
      playbackRateAvailability: 'unsupported',
      setPlaybackRate: vi.fn(),
    });

    render(<PlaybackRateButton data-testid="button" />, { wrapper: PlayerWrapper });

    expect(screen.queryByTestId('button')).toBeNull();
  });

  it('publishes the rate length alongside the consumer style', () => {
    const { Wrapper: PlayerWrapper } = createPlayerWrapper({
      playbackRate: 1.75,
      playbackRates: [1, 1.75],
      playbackRateAvailability: 'available',
      setPlaybackRate: vi.fn(),
    });

    render(<PlaybackRateButton data-testid="button" style={{ color: 'red' }} />, { wrapper: PlayerWrapper });

    const button = screen.getByTestId('button');

    expect(button.style.getPropertyValue('--media-playback-rate-length')).toBe('4');
    expect(button.style.color).toBe('red');
  });

  it('shows the control name and the speed-up shortcut in the tooltip', async () => {
    const container = document.createElement('div');
    const value = createContextValue(container);

    render(
      <Wrapper value={value}>
        <Tooltip.Root defaultOpen>
          <Tooltip.Trigger render={<PlaybackRateButton data-testid="button" />} />
          <Tooltip.Popup data-testid="popup">
            <Tooltip.Label />
            <Tooltip.Shortcut className={shortcutClassName} />
          </Tooltip.Popup>
        </Tooltip.Root>
        <Hotkey keys=">" action="speedUp" />
        <Hotkey keys="<" action="speedDown" />
      </Wrapper>
    );

    const button = document.querySelector('[data-testid="button"]');

    await waitFor(() => {
      expect(document.querySelector('[data-testid="popup"] span')?.textContent).toBe('Playback rate');
      expect(document.querySelector('[data-testid="popup"] kbd')?.textContent).toBe('>');
    });
    expect(button?.getAttribute('aria-label')).toBe('Playback rate, 1');
    expect(button?.getAttribute('aria-keyshortcuts')).toBe('>');
  });
});

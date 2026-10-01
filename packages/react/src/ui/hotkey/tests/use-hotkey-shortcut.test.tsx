import { render, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vite-plus/test';

import { PlayerContextProvider, type PlayerContextValue } from '../../../player/context';
import { createMockStore } from '../../../testing/mocks';
import { Hotkey } from '../component';
import { useHotkeyShortcut } from '../use-hotkey-shortcut';

function createContextValue(container: HTMLElement): PlayerContextValue {
  return {
    store: createMockStore() as any,
    media: null,
    setMedia: vi.fn(),
    container,
    setContainer: vi.fn(),
  };
}

function Wrapper({ children, value }: { children: ReactNode; value: PlayerContextValue }) {
  return <PlayerContextProvider value={value}>{children}</PlayerContextProvider>;
}

function Shortcut({ keys }: { keys: string }) {
  const shortcut = useHotkeyShortcut('togglePaused');

  return (
    <>
      <span data-testid="shortcut">{shortcut.shortcut}</span>
      <span data-testid="aria">{shortcut.aria}</span>
      <Hotkey keys={keys} action="togglePaused" />
    </>
  );
}

describe('useHotkeyShortcut', () => {
  it('updates when hotkey registrations change', async () => {
    const container = document.createElement('div');
    const value = createContextValue(container);
    const { rerender } = render(
      <Wrapper value={value}>
        <Shortcut keys="k" />
      </Wrapper>
    );

    await waitFor(() => expect(document.querySelector('[data-testid="shortcut"]')?.textContent).toBe('K'));
    expect(document.querySelector('[data-testid="aria"]')?.textContent).toBe('k');

    rerender(
      <Wrapper value={value}>
        <Shortcut keys="p" />
      </Wrapper>
    );

    await waitFor(() => expect(document.querySelector('[data-testid="shortcut"]')?.textContent).toBe('P'));
    expect(document.querySelector('[data-testid="aria"]')?.textContent).toBe('p');
  });
});

describe('Hotkey', () => {
  it('registers the default ArrowDown volume step', () => {
    const container = document.createElement('div');
    const value = createContextValue(container);
    const setVolume = vi.fn();

    value.store = createMockStore({ volume: 0.5, muted: false, setVolume }) as unknown as PlayerContextValue['store'];
    render(
      <Wrapper value={value}>
        <Hotkey keys="ArrowDown" action="volumeStep" />
      </Wrapper>
    );

    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

    expect(setVolume).toHaveBeenCalledExactlyOnceWith(0.45);
  });
});

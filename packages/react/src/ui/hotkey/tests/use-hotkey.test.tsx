import { cleanup, render, waitFor } from '@testing-library/react';
import { findHotkeyCoordinator } from '@videojs/core/dom';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { PlayerContextProvider, type PlayerContextValue } from '../../../player/context';
import { createMockStore } from '../../../testing/mocks';
import { StatusIndicatorRoot } from '../../status-indicator/root';
import { StatusIndicatorValue } from '../../status-indicator/value';
import { useHotkey, type UseHotkeyOptions } from '../use-hotkey';

function createContextValue(container: HTMLElement): PlayerContextValue {
  return {
    store: createMockStore({ playbackRate: 1 }) as any,
    media: null,
    setMedia: vi.fn(),
    container,
    setContainer: vi.fn(),
  };
}

function Wrapper({ children, value }: { children: ReactNode; value: PlayerContextValue }) {
  return <PlayerContextProvider value={value}>{children}</PlayerContextProvider>;
}

function CustomHotkey(props: UseHotkeyOptions) {
  useHotkey(props);

  return null;
}

afterEach(() => {
  cleanup();
});

describe('useHotkey', () => {
  it('reports the action and value to hotkey subscribers', async () => {
    const container = document.createElement('div');
    const onActivate = vi.fn();

    render(
      <Wrapper value={createContextValue(container)}>
        <CustomHotkey keys=">" action="stepRate" value={1} onActivate={onActivate} />
      </Wrapper>
    );

    await waitFor(() => expect(findHotkeyCoordinator(container)).toBeDefined());

    const activate = vi.fn();

    findHotkeyCoordinator(container)!.subscribe(activate);
    container.dispatchEvent(new KeyboardEvent('keydown', { key: '>', shiftKey: true, bubbles: true }));

    expect(activate).toHaveBeenCalledWith(expect.objectContaining({ action: 'stepRate', value: 1 }));
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it('opens a status indicator that derives a custom status for the action', async () => {
    const container = document.createElement('div');

    document.body.append(container);

    render(
      <Wrapper value={createContextValue(container)}>
        <CustomHotkey keys=">" action="stepRate" value={1} onActivate={() => {}} />
        <StatusIndicatorRoot
          deriveCustomStatus={(event) =>
            event.action === 'stepRate' ? { status: 'rate-up', label: '1.5×', value: null } : null
          }
        >
          <StatusIndicatorValue />
        </StatusIndicatorRoot>
      </Wrapper>,
      { container }
    );

    await waitFor(() => expect(findHotkeyCoordinator(container)).toBeDefined());

    container.dispatchEvent(new KeyboardEvent('keydown', { key: '>', shiftKey: true, bubbles: true }));

    await waitFor(() => expect(container.querySelector('[data-status]')?.getAttribute('data-status')).toBe('rate-up'));
    expect(container.querySelector('[data-status]')?.textContent).toBe('1.5×');

    container.remove();
  });

  it('does not repeat toggle actions unless repeatable is set', async () => {
    const container = document.createElement('div');
    const onToggle = vi.fn();
    const onRepeatableToggle = vi.fn();

    render(
      <Wrapper value={createContextValue(container)}>
        <CustomHotkey keys="k" action="togglePaused" onActivate={onToggle} />
        <CustomHotkey keys="l" action="togglePaused" repeatable onActivate={onRepeatableToggle} />
      </Wrapper>
    );

    await waitFor(() => expect(findHotkeyCoordinator(container)).toBeDefined());

    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', repeat: true, bubbles: true }));
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'l', repeat: true, bubbles: true }));

    expect(onToggle).not.toHaveBeenCalled();
    expect(onRepeatableToggle).toHaveBeenCalledTimes(1);
  });
});

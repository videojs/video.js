import { cleanup, render } from '@testing-library/react';
import { getGestureCoordinator } from '@videojs/core/dom';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { PlayerContextProvider, type PlayerContextValue } from '../../../player/context';
import { createMockStore } from '../../../testing/mocks';
import { Gesture } from '../component';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

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

describe('Gesture', () => {
  it('preserves the tap claim when disabled', () => {
    const container = document.createElement('div');
    const value = createContextValue(container);

    render(
      <Wrapper value={value}>
        <Gesture type="tap" action="toggleControls" pointer="touch" disabled />
      </Wrapper>
    );

    const event = new MouseEvent('pointerup', { bubbles: true });

    Object.defineProperty(event, 'pointerType', { value: 'touch' });
    container.dispatchEvent(event);

    // SAFETY: This MouseEvent carries the pointerType read by claimsTap.
    expect(getGestureCoordinator(container).claimsTap(event as PointerEvent, 'toggleControls')).toBe(true);
  });

  it('defaults a left seek gesture to the backward step', () => {
    const container = document.createElement('div');
    const value = createContextValue(container);
    const seek = vi.fn();

    value.store = createMockStore({
      currentTime: 30,
      duration: 60,
      seeking: false,
      seek,
    }) as unknown as PlayerContextValue['store'];
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({ left: 0, width: 300 } as DOMRect);
    render(
      <Wrapper value={value}>
        <Gesture type="doubletap" action="seekStep" region="left" />
      </Wrapper>
    );

    for (let i = 0; i < 2; i++) {
      const down = new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 50 });
      const up = new MouseEvent('pointerup', { bubbles: true, button: 0, clientX: 50 });

      Object.defineProperty(up, 'pointerType', { value: 'touch' });
      container.dispatchEvent(down);
      vi.advanceTimersByTime(50);
      container.dispatchEvent(up);
      vi.advanceTimersByTime(50);
    }

    expect(seek).toHaveBeenCalledExactlyOnceWith(20);
  });
});

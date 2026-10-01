import { act, fireEvent, render } from '@testing-library/react';
import type { HotkeyActionName } from '@videojs/core';
import { getHotkeyCoordinator } from '@videojs/core/dom';
import type { ReactNode } from 'react';
import { vi } from 'vite-plus/test';

import { createPlayerWrapper } from '../../../testing/mocks';

export function renderIndicator(ui: ReactNode) {
  const { value, Wrapper } = createPlayerWrapper({
    paused: true,
    ended: false,
    started: false,
    waiting: false,
    play: async () => {},
    pause: () => {},
    volume: 0.5,
    muted: false,
    setVolume: async () => {},
    setMuted: async () => {},
    currentTime: 30,
    duration: 120,
    seeking: false,
    seek: async () => {},
  });
  const container = document.createElement('div');

  document.body.append(container);
  value.container = container;
  const result = render(ui, { wrapper: Wrapper, container });
  const unbind: (() => void)[] = [];

  return {
    getByTestId: (id: string): HTMLElement => result.getByTestId(id),
    async input(key: string, action: HotkeyActionName, actionValue?: number) {
      unbind.push(
        getHotkeyCoordinator(container).add({
          keys: key,
          action,
          value: actionValue,
          onActivate: () => {},
        })
      );
      await act(async () => {
        fireEvent.keyDown(container, { key });
      });
    },
    dispose() {
      result.unmount();

      for (const remove of unbind) remove();

      container.remove();
    },
  };
}

export function controlFrames() {
  let nextId = 0;
  const callbacks = new Map<number, FrameRequestCallback>();

  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callbacks.set(++nextId, callback);
    return nextId;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => callbacks.delete(id));

  return async () => {
    await act(async () => {
      const frame = [...callbacks.values()];

      callbacks.clear();

      for (const callback of frame) callback(0);
    });
  };
}

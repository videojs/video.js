import { act, fireEvent } from '@testing-library/react';
import { createStore, flush } from '@videojs/store';
import type { ReactNode } from 'react';
import { type Mock, vi } from 'vite-plus/test';

import { I18nProvider } from '../../../i18n';
import { PlayerContextProvider } from '../../../player/context';

export function createSliderPlayerWrapper(initial: Record<string, unknown> = {}) {
  let update: (patch: Record<string, unknown>) => void;
  const store = createStore<unknown>()({
    name: 'sliderTest',
    state: ({ set }) => {
      update = set;
      return initial;
    },
  });
  const value = { store, media: null, container: null, setMedia: vi.fn(), setContainer: vi.fn() };

  return {
    update(patch: Record<string, unknown>) {
      act(() => {
        update(patch);
        flush();
      });
    },
    Wrapper({ children }: { children: ReactNode }) {
      return (
        <PlayerContextProvider value={value}>
          <I18nProvider>{children}</I18nProvider>
        </PlayerContextProvider>
      );
    },
  };
}

export function measureSlider(root: HTMLElement, width = 200): void {
  root.getBoundingClientRect = () => new DOMRect(0, 0, width, 20);
  root.setPointerCapture = vi.fn();
  root.releasePointerCapture = vi.fn();
}

export function pointer(root: HTMLElement, type: string, clientX: number, buttons = 1): void {
  const event = new MouseEvent(type, { bubbles: true, clientX, clientY: 5, buttons });

  Object.defineProperties(event, { pointerId: { value: 1 }, pointerType: { value: 'mouse' } });

  act(() => {
    fireEvent(root, event);
    flush();
  });
}

export function startDrag(root: HTMLElement): void {
  measureSlider(root);
  pointer(root, 'pointerdown', 50);
  pointer(root, 'pointermove', 60);
}

export function endDrag(root: HTMLElement): void {
  pointer(root, 'pointerup', 60, 0);
  pointer(root, 'lostpointercapture', 60, 0);
}

export class ResizeObserverStub {
  static instances: ResizeObserverStub[] = [];
  observe: Mock<(target: Element) => void> = vi.fn();
  disconnect: Mock<() => void> = vi.fn();

  constructor(readonly callback: ResizeObserverCallback) {
    ResizeObserverStub.instances.push(this);
  }

  static measure(target: Element, width: number): void {
    const observer = this.instances.find(({ observe }) => observe.mock.calls.some(([element]) => element === target));
    if (!observer) throw new Error('Element was not observed');

    // SAFETY: the recording observer receives only the contentRect width used by SliderPreview.
    act(() =>
      observer.callback(
        [{ target, contentRect: { width } } as ResizeObserverEntry],
        observer as unknown as ResizeObserver
      )
    );
  }
}

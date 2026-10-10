import { vi } from 'vite-plus/test';

export function measureSlider(slider: HTMLElement, width = 200): void {
  slider.getBoundingClientRect = () => new DOMRect(0, 0, width, 20);
  slider.setPointerCapture = vi.fn();
  slider.releasePointerCapture = vi.fn();
}

export function pointer(slider: HTMLElement, type: string, clientX: number, buttons = 1): void {
  slider.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 1, pointerType: 'mouse', clientX, buttons }));
}

export function stubResizeObserver() {
  const observers: ResizeObserverStub[] = [];

  class ResizeObserverStub implements ResizeObserver {
    readonly targets: Element[] = [];

    constructor(readonly callback: ResizeObserverCallback) {
      observers.push(this);
    }

    observe(target: Element): void {
      this.targets.push(target);
    }

    unobserve(): void {}

    disconnect(): void {}
  }

  vi.stubGlobal('ResizeObserver', ResizeObserverStub);

  return {
    resize(target: Element): void {
      for (const observer of observers) {
        if (observer.targets.includes(target)) observer.callback([], observer);
      }
    },
  };
}

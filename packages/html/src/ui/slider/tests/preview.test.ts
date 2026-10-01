import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vite-plus/test';

import { SliderElement } from '../element';
import { SliderPreviewElement } from '../preview';

class ResizeObserverStub {
  static instances: ResizeObserverStub[] = [];
  observe = vi.fn();
  disconnect = vi.fn();

  constructor(readonly callback: ResizeObserverCallback) {
    ResizeObserverStub.instances.push(this);
  }
}

beforeAll(() => vi.stubGlobal('ResizeObserver', ResizeObserverStub));
afterAll(() => vi.unstubAllGlobals());

function observerFor(target: Element): ResizeObserverStub {
  const observer = ResizeObserverStub.instances.find(({ observe }) => observe.mock.calls.some(([el]) => el === target));

  expect(observer).toBeDefined();
  return observer!;
}

let tagCounter = 0;

function uniqueTag(base: string): string {
  return `${base}-${tagCounter++}`;
}

function createElement<Element extends HTMLElement>(Base: abstract new () => Element): Element {
  const tag = uniqueTag('test-slp');

  customElements.define(tag, class extends (Base as unknown as typeof HTMLElement) {});
  return document.createElement(tag) as Element;
}

afterEach(() => {
  document.body.innerHTML = '';
  ResizeObserverStub.instances.length = 0;
});

describe('SliderPreviewElement', () => {
  it('defaults overflow to clamp', () => {
    const el = createElement(SliderPreviewElement);

    expect(el.overflow).toBe('clamp');
  });

  it('sets structural positioning styles after connect', async () => {
    const slider = createElement(SliderElement);
    const preview = createElement(SliderPreviewElement);

    slider.appendChild(preview);
    document.body.appendChild(slider);

    await slider.updateComplete;
    await preview.updateComplete;

    expect(preview.style.position).toBe('absolute');
    expect(preview.style.pointerEvents).toBe('none');
    expect(preview.style.width).toBe('max-content');
  });

  it('applies clamped left style by default', async () => {
    const slider = createElement(SliderElement);
    const preview = createElement(SliderPreviewElement);

    const spy = vi.spyOn(preview.style, 'setProperty');

    slider.append(preview);
    document.body.append(slider);
    await slider.updateComplete;
    await preview.updateComplete;

    const observer = observerFor(preview);

    // SAFETY: this recording observer receives the contentRect width consumed by the preview.
    observer.callback(
      [{ target: preview, contentRect: { width: 120 } } as unknown as ResizeObserverEntry],
      observer as unknown as ResizeObserver
    );
    expect(spy.mock.calls.filter(([key]) => key === 'left').at(-1)?.[1]).toBe(
      'min(max(0px, calc(var(--media-slider-pointer) - 60px)), calc(100% - 120px))'
    );

    preview.overflow = 'visible';
    await preview.updateComplete;
    expect(spy.mock.calls.filter(([key]) => key === 'left').at(-1)?.[1]).toBe(
      'calc(var(--media-slider-pointer) - 60px)'
    );
  });

  it('applies unclamped left style when overflow is visible', async () => {
    const slider = createElement(SliderElement);
    const preview = createElement(SliderPreviewElement);

    preview.overflow = 'visible';
    const spy = vi.spyOn(preview.style, 'setProperty');

    slider.append(preview);
    document.body.append(slider);
    await slider.updateComplete;
    await preview.updateComplete;

    const observer = observerFor(preview);

    // SAFETY: this recording observer receives the contentRect width consumed by the preview.
    observer.callback(
      [{ target: preview, contentRect: { width: 120 } } as unknown as ResizeObserverEntry],
      observer as unknown as ResizeObserver
    );
    expect(spy.mock.calls.filter(([key]) => key === 'left').at(-1)?.[1]).toBe(
      'calc(var(--media-slider-pointer) - 60px)'
    );

    preview.overflow = 'clamp';
    await preview.updateComplete;
    expect(spy.mock.calls.filter(([key]) => key === 'left').at(-1)?.[1]).toBe(
      'min(max(0px, calc(var(--media-slider-pointer) - 60px)), calc(100% - 120px))'
    );
  });

  it('propagates data attributes from slider state', async () => {
    const slider = createElement(SliderElement);
    const preview = createElement(SliderPreviewElement);

    slider.appendChild(preview);
    document.body.appendChild(slider);

    await slider.updateComplete;
    await preview.updateComplete;

    expect(preview.getAttribute('data-orientation')).toBe('horizontal');
  });

  it('cleans up ResizeObserver on disconnect', async () => {
    const slider = createElement(SliderElement);
    const preview = createElement(SliderPreviewElement);

    slider.appendChild(preview);
    document.body.appendChild(slider);

    await slider.updateComplete;
    await preview.updateComplete;

    const observer = observerFor(preview);

    expect(observer.disconnect).not.toHaveBeenCalled();
    slider.removeChild(preview);
    expect(observer.disconnect).toHaveBeenCalledOnce();
  });
});

import type { AnyPlayerStore } from '@videojs/core/dom';
import { ContextProvider } from '@videojs/element/context';
import type { MediaControlsState } from '@videojs/media';
import { createStore, flush } from '@videojs/store';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { playerContext } from '../../../player/context';
import { UIElement } from '../../ui-element';
import { SliderElement } from '../element';
import { SliderThumbElement } from '../thumb';
import { SliderTrackElement } from '../track';
import { SliderValueElement } from '../value';
import { measureSlider, pointer, stubResizeObserver } from './support';

// Unique tag names to avoid customElements.define collisions across tests.
let tagCounter = 0;

function uniqueTag(base: string): string {
  return `${base}-${tagCounter++}`;
}

function createElement<Element extends HTMLElement>(Base: abstract new () => Element): Element {
  const tag = uniqueTag('test-el');

  customElements.define(tag, class extends (Base as unknown as typeof HTMLElement) {});
  return document.createElement(tag) as Element;
}

function createControlsStore(requestControlsLock: MediaControlsState['requestControlsLock']): AnyPlayerStore {
  return createStore<unknown>()<MediaControlsState>({
    name: 'controls',
    state: () => ({
      userActive: true,
      controlsVisible: true,
      requestControlsLock,
      toggleControls: () => true,
    }),
  }) as unknown as AnyPlayerStore;
}

class TestPlayerProviderElement extends UIElement {
  readonly releaseControlsLock = vi.fn();
  readonly requestControlsLock = vi.fn(() => this.releaseControlsLock);
  readonly store = createControlsStore(this.requestControlsLock);
  readonly provider = new ContextProvider(this, {
    context: playerContext,
    initialValue: this.store,
  });
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('SliderElement', () => {
  it('initializes with default property values', () => {
    const slider = createElement(SliderElement);

    expect(slider.label).toBe('');
    expect(slider.value).toBe(0);
    expect(slider.min).toBe(0);
    expect(slider.max).toBe(100);
    expect(slider.step).toBe(1);
    expect(slider.largeStep).toBe(10);
    expect(slider.orientation).toBe('horizontal');
    expect(slider.disabled).toBe(false);
    expect(slider.thumbAlignment).toBe('center');
  });

  it('sets CSS custom properties after update', async () => {
    const slider = createElement(SliderElement);

    slider.value = 50;

    document.body.appendChild(slider);
    await slider.updateComplete;

    expect(slider.style.getPropertyValue('--media-slider-fill')).toBe('50.000%');
    expect(slider.style.getPropertyValue('--media-slider-pointer')).toBe('0.000%');
  });

  it('sets data-orientation attribute', async () => {
    const slider = createElement(SliderElement);

    document.body.appendChild(slider);
    await slider.updateComplete;

    expect(slider.getAttribute('data-orientation')).toBe('horizontal');
  });

  it('does not set data-dragging or data-pointing in idle state', async () => {
    const slider = createElement(SliderElement);

    document.body.appendChild(slider);
    await slider.updateComplete;

    expect(slider.hasAttribute('data-dragging')).toBe(false);
    expect(slider.hasAttribute('data-pointing')).toBe(false);
    expect(slider.hasAttribute('data-interactive')).toBe(false);

    measureSlider(slider);
    pointer(slider, 'pointermove', 50, 0);
    flush();
    await slider.updateComplete;
    expect(slider.hasAttribute('data-pointing')).toBe(true);
    expect(slider.hasAttribute('data-interactive')).toBe(true);

    pointer(slider, 'pointerdown', 50);
    pointer(slider, 'pointermove', 60);
    flush();
    await slider.updateComplete;
    expect(slider.hasAttribute('data-dragging')).toBe(true);

    pointer(slider, 'pointerup', 60, 0);
    pointer(slider, 'lostpointercapture', 60, 0);
    pointer(slider, 'pointerleave', 60, 0);
    flush();
    await slider.updateComplete;
    expect(slider.hasAttribute('data-interactive')).toBe(false);

    const thumb = createElement(SliderThumbElement);

    slider.append(thumb);
    await thumb.updateComplete;
    thumb.dispatchEvent(new FocusEvent('focus'));
    flush();
    await slider.updateComplete;
    expect(slider.hasAttribute('data-interactive')).toBe(true);
  });

  it('reflects disabled state as data-disabled', async () => {
    const slider = createElement(SliderElement);

    slider.disabled = true;

    document.body.appendChild(slider);
    await slider.updateComplete;

    expect(slider.hasAttribute('data-disabled')).toBe(true);
  });

  it('sets touch-action and user-select styles on connect', async () => {
    const slider = createElement(SliderElement);

    document.body.appendChild(slider);
    await slider.updateComplete;

    expect(slider.style.touchAction).toBe('none');
    expect(slider.style.userSelect).toBe('none');
  });

  it('updates CSS vars when value changes', async () => {
    const slider = createElement(SliderElement);

    slider.value = 25;

    document.body.appendChild(slider);
    await slider.updateComplete;

    expect(slider.style.getPropertyValue('--media-slider-fill')).toBe('25.000%');

    slider.value = 75;
    await slider.updateComplete;

    expect(slider.style.getPropertyValue('--media-slider-fill')).toBe('75.000%');
  });

  it('binds rootProps pointer events on connect', async () => {
    const slider = createElement(SliderElement);

    slider.value = 0;

    document.body.appendChild(slider);
    await slider.updateComplete;

    // Stub setPointerCapture/releasePointerCapture (not available in happy-dom).
    slider.setPointerCapture = vi.fn();
    slider.releasePointerCapture = vi.fn();

    const spy = vi.fn();

    slider.addEventListener('value-change', spy);

    // Simulate pointerdown on the slider element.
    slider.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, clientX: 50, clientY: 0 }));

    // pointerdown triggers onValueChange via rootProps.
    expect(spy).toHaveBeenCalled();
  });

  it('holds a controls visibility lock for the duration of a drag', async () => {
    const provider = createElement(TestPlayerProviderElement);
    const slider = createElement(SliderElement);

    provider.append(slider);
    document.body.append(provider);
    await slider.updateComplete;

    slider.setPointerCapture = vi.fn();
    slider.releasePointerCapture = vi.fn();

    slider.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, clientX: 50 }));
    slider.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 1, clientX: 55, buttons: 1 }));

    expect(provider.requestControlsLock).toHaveBeenCalledTimes(1);
    expect(provider.releaseControlsLock).not.toHaveBeenCalled();

    slider.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1, clientX: 55 }));
    slider.dispatchEvent(new PointerEvent('lostpointercapture', { bubbles: true, pointerId: 1 }));

    expect(provider.releaseControlsLock).toHaveBeenCalledTimes(1);
  });

  it('holds a controls visibility lock while the pointer rests without dragging', async () => {
    const provider = createElement(TestPlayerProviderElement);
    const slider = createElement(SliderElement);

    provider.append(slider);
    document.body.append(provider);
    await slider.updateComplete;

    slider.setPointerCapture = vi.fn();
    slider.releasePointerCapture = vi.fn();

    slider.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, clientX: 50 }));

    expect(provider.requestControlsLock).toHaveBeenCalledTimes(1);
    expect(provider.releaseControlsLock).not.toHaveBeenCalled();

    slider.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1, clientX: 50 }));
    slider.dispatchEvent(new PointerEvent('lostpointercapture', { bubbles: true, pointerId: 1 }));

    expect(provider.releaseControlsLock).toHaveBeenCalledTimes(1);
  });

  it('re-renders on resize only when thumb alignment is edge', async () => {
    const { resize } = stubResizeObserver();

    try {
      const slider = createElement(SliderElement);

      document.body.appendChild(slider);
      await slider.updateComplete;

      const requestUpdate = vi.spyOn(slider, 'requestUpdate');

      resize(slider);
      expect(requestUpdate).not.toHaveBeenCalled();

      slider.thumbAlignment = 'edge';
      await slider.updateComplete;
      requestUpdate.mockClear();

      resize(slider);
      expect(requestUpdate).toHaveBeenCalledTimes(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('supports vertical orientation', async () => {
    const slider = createElement(SliderElement);

    slider.orientation = 'vertical';

    document.body.appendChild(slider);
    await slider.updateComplete;

    expect(slider.getAttribute('data-orientation')).toBe('vertical');
  });

  it('dispatches value-change on value-commit as CustomEvent', async () => {
    const slider = createElement(SliderElement);

    document.body.appendChild(slider);
    await slider.updateComplete;
    measureSlider(slider);

    const received: Event[] = [];
    const record = (event: Event) => received.push(event);

    document.body.addEventListener('value-change', record);
    document.body.addEventListener('value-commit', record);

    try {
      pointer(slider, 'pointerdown', 50);
      pointer(slider, 'pointerup', 50, 0);
      pointer(slider, 'lostpointercapture', 50, 0);

      expect(received.map(({ type }) => type)).toEqual(['value-change', 'value-change', 'value-commit']);

      for (const event of received) {
        expect(event).toBeInstanceOf(CustomEvent);
        expect((event as CustomEvent).detail).toEqual({ value: 25 });
        expect(event.bubbles).toBe(true);
        expect(event.target).toBe(slider);
      }
    } finally {
      document.body.removeEventListener('value-change', record);
      document.body.removeEventListener('value-commit', record);
    }
  });
});

describe('SliderThumbElement', () => {
  it('receives ARIA attributes from slider context', async () => {
    const slider = createElement(SliderElement);
    const thumb = createElement(SliderThumbElement);

    slider.value = 30;
    slider.appendChild(thumb);
    document.body.appendChild(slider);
    await slider.updateComplete;
    await thumb.updateComplete;

    expect(thumb.getAttribute('role')).toBe('slider');
    expect(thumb.getAttribute('tabindex')).toBe('0');
    expect(thumb.getAttribute('autocomplete')).toBe('off');
    expect(thumb.getAttribute('aria-valuemin')).toBe('0');
    expect(thumb.getAttribute('aria-valuemax')).toBe('100');
    expect(thumb.getAttribute('aria-valuenow')).toBe('30');
    expect(thumb.getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('updates ARIA when slider value changes', async () => {
    const slider = createElement(SliderElement);
    const thumb = createElement(SliderThumbElement);

    slider.appendChild(thumb);
    document.body.appendChild(slider);
    await slider.updateComplete;
    await thumb.updateComplete;

    expect(thumb.getAttribute('aria-valuenow')).toBe('0');

    slider.value = 60;
    await slider.updateComplete;
    await thumb.updateComplete;

    expect(thumb.getAttribute('aria-valuenow')).toBe('60');
  });

  it('sets aria-disabled when slider is disabled', async () => {
    const slider = createElement(SliderElement);
    const thumb = createElement(SliderThumbElement);

    slider.disabled = true;
    slider.appendChild(thumb);
    document.body.appendChild(slider);
    await slider.updateComplete;
    await thumb.updateComplete;

    expect(thumb.getAttribute('aria-disabled')).toBe('true');
    expect(thumb.getAttribute('tabindex')).toBe('-1');
  });

  it('propagates data attributes from context', async () => {
    const slider = createElement(SliderElement);
    const thumb = createElement(SliderThumbElement);

    slider.appendChild(thumb);
    document.body.appendChild(slider);
    await slider.updateComplete;
    await thumb.updateComplete;

    expect(thumb.getAttribute('data-orientation')).toBe('horizontal');
  });
});

describe('SliderTrackElement', () => {
  it('receives data attributes from slider context', async () => {
    const slider = createElement(SliderElement);
    const track = createElement(SliderTrackElement);

    slider.appendChild(track);
    document.body.appendChild(slider);
    await slider.updateComplete;
    await track.updateComplete;

    expect(track.getAttribute('data-orientation')).toBe('horizontal');
  });
});

describe('SliderFillElement', () => {});

describe('SliderBufferElement', () => {});

describe('SliderValueElement', () => {
  it('displays the current value from context', async () => {
    const slider = createElement(SliderElement);
    const valueEl = createElement(SliderValueElement);

    slider.value = 42;
    slider.appendChild(valueEl);
    document.body.appendChild(slider);
    await slider.updateComplete;
    await valueEl.updateComplete;

    expect(valueEl.textContent).toBe('42');
  });

  it('displays rounded value by default', async () => {
    const slider = createElement(SliderElement);
    const valueEl = createElement(SliderValueElement);

    slider.value = 33.6;
    slider.min = 0;
    slider.max = 100;
    slider.appendChild(valueEl);
    document.body.appendChild(slider);
    await slider.updateComplete;
    await valueEl.updateComplete;

    expect(valueEl.textContent).toBe('34');
  });

  it('sets aria-live="off"', async () => {
    const slider = createElement(SliderElement);
    const valueEl = createElement(SliderValueElement);

    slider.appendChild(valueEl);
    document.body.appendChild(slider);
    await slider.updateComplete;

    expect(valueEl.getAttribute('aria-live')).toBe('off');
  });
});

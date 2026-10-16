import type { AnyPlayerStore } from '@videojs/core/dom';
import { ContextProvider } from '@videojs/element/context';
import type { MediaVolumeState } from '@videojs/media';
import { createStore } from '@videojs/store';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { playerContext } from '../../../player/context';
import { measureSlider, pointer, stubResizeObserver } from '../../slider/tests/support';
import { SliderThumbElement } from '../../slider/thumb';
import { UIElement } from '../../ui-element';
import { VolumeSliderElement } from '../element';

let tagCounter = 0;

function uniqueTag(base: string): string {
  return `${base}-${tagCounter++}`;
}

function createElement<Element extends HTMLElement>(Base: abstract new () => Element): Element {
  const tag = uniqueTag('test-el');

  customElements.define(tag, class extends (Base as unknown as typeof HTMLElement) {});
  return document.createElement(tag) as Element;
}

const setVolume = vi.fn();

function createVolumeStore(volumeAvailability: MediaVolumeState['volumeAvailability'], volume = 1): AnyPlayerStore {
  return createStore<unknown>()<MediaVolumeState>({
    name: 'volume',
    state: () => ({
      volume,
      muted: false,
      volumeAvailability,
      // Mute has an availability of its own, and this slider reads the level's;
      // these tests vary that one and leave the mute available throughout.
      mutedAvailability: 'available',
      setVolume,
      setMuted: vi.fn(),
    }),
  }) as unknown as AnyPlayerStore;
}

class TestPlayerProviderElement extends UIElement {
  store: AnyPlayerStore = createVolumeStore('available');

  readonly #provider = new ContextProvider(this, { context: playerContext });

  override connectedCallback(): void {
    this.#provider.setValue(this.store);
    super.connectedCallback();
  }
}

if (!customElements.get('test-volume-slider-player')) {
  customElements.define('test-volume-slider-player', TestPlayerProviderElement);
}

afterEach(() => {
  document.body.innerHTML = '';
  setVolume.mockClear();
});

describe('VolumeSliderElement', () => {
  it('initializes with default property values', () => {
    const slider = createElement(VolumeSliderElement);

    expect(slider.label).toBe('');
    expect(slider.step).toBe(5);
    expect(slider.largeStep).toBe(10);
    expect(slider.orientation).toBe('horizontal');
    expect(slider.disabled).toBe(false);
    expect(slider.thumbAlignment).toBe('center');
  });

  it('binds rootProps pointer events on connect', async () => {
    const provider = document.createElement('test-volume-slider-player') as TestPlayerProviderElement;
    const slider = createElement(VolumeSliderElement);

    document.body.append(provider);
    provider.append(slider);
    await slider.updateComplete;
    measureSlider(slider);
    pointer(slider, 'pointerdown', 50);
    pointer(slider, 'pointerup', 50, 0);
    pointer(slider, 'lostpointercapture', 50, 0);
    expect(setVolume).toHaveBeenCalledWith(0.25);

    vi.mocked(setVolume).mockClear();
    const wheel = new WheelEvent('wheel', { deltaY: 1, bubbles: true, cancelable: true });

    slider.dispatchEvent(wheel);
    expect(wheel.defaultPrevented).toBe(true);
    expect(setVolume).toHaveBeenCalledOnce();
  });

  it.each([
    { wheelStep: 5, deltaY: 120, expectedVolume: 0.75 },
    { wheelStep: 5, deltaY: -120, expectedVolume: 0.85 },
    { wheelStep: 2, deltaY: 120, expectedVolume: 0.78 },
    { wheelStep: 2, deltaY: -120, expectedVolume: 0.82 },
  ])(
    'uses wheel-step=$wheelStep independently of step for deltaY=$deltaY',
    async ({ wheelStep, deltaY, expectedVolume }) => {
      const provider = createElement(TestPlayerProviderElement);

      provider.store = createVolumeStore('available', 0.8);
      const slider = createElement(VolumeSliderElement);

      slider.setAttribute('step', '10');
      slider.setAttribute('wheel-step', String(wheelStep));
      document.body.append(provider);
      provider.append(slider);
      await slider.updateComplete;

      slider.dispatchEvent(new WheelEvent('wheel', { deltaY, bubbles: true, cancelable: true }));

      expect(setVolume).toHaveBeenCalledExactlyOnceWith(expectedVolume);
    }
  );

  it('re-renders on resize only when thumb alignment is edge', async () => {
    const { resize } = stubResizeObserver();

    try {
      const slider = createElement(VolumeSliderElement);

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

  it('sets touch-action and user-select styles on connect', async () => {
    const slider = createElement(VolumeSliderElement);

    document.body.appendChild(slider);
    await slider.updateComplete;

    expect(slider.style.touchAction).toBe('none');
    expect(slider.style.userSelect).toBe('none');
  });

  it('supports vertical orientation', async () => {
    const provider = document.createElement('test-volume-slider-player');
    const slider = createElement(VolumeSliderElement);
    const thumb = createElement(SliderThumbElement);

    slider.setAttribute('orientation', 'vertical');
    slider.append(thumb);
    document.body.append(provider);
    provider.append(slider);
    await slider.updateComplete;
    await thumb.updateComplete;

    expect(slider.getAttribute('data-orientation')).toBe('vertical');
    expect(thumb.getAttribute('aria-orientation')).toBe('vertical');
  });

  it('does not set CSS vars without player context', async () => {
    const slider = createElement(VolumeSliderElement);

    document.body.appendChild(slider);
    await slider.updateComplete;

    // Without player store providing volume state, the element guards early.
    expect(slider.style.getPropertyValue('--media-slider-fill')).toBe('');

    const provider = document.createElement('test-volume-slider-player');

    document.body.append(provider);
    provider.append(slider);
    await slider.updateComplete;
    expect(slider.style.getPropertyValue('--media-slider-fill')).toBe('100.000%');
  });

  it('hides and disables unavailable volume control', async () => {
    const provider = document.createElement('test-volume-slider-player') as TestPlayerProviderElement;

    provider.store = createVolumeStore('unsupported');
    const slider = createElement(VolumeSliderElement);
    const thumb = createElement(SliderThumbElement);

    document.body.append(provider);
    slider.append(thumb);
    provider.append(slider);
    await slider.updateComplete;
    await thumb.updateComplete;

    expect(slider.hidden).toBe(true);
    expect(slider.hasAttribute('data-hidden')).toBe(true);
    expect(slider.hasAttribute('data-disabled')).toBe(true);
    expect(thumb.getAttribute('aria-disabled')).toBe('true');
    expect(thumb.tabIndex).toBe(-1);
  });

  it('cleans up on disconnect', async () => {
    const provider = document.createElement('test-volume-slider-player') as TestPlayerProviderElement;
    const slider = createElement(VolumeSliderElement);

    document.body.append(provider);
    provider.append(slider);
    await slider.updateComplete;
    slider.dispatchEvent(new WheelEvent('wheel', { deltaY: 1, bubbles: true, cancelable: true }));
    expect(setVolume).toHaveBeenCalledOnce();

    slider.remove();
    provider.append(slider);
    await slider.updateComplete;
    vi.mocked(setVolume).mockClear();
    slider.dispatchEvent(new WheelEvent('wheel', { deltaY: 1, bubbles: true, cancelable: true }));
    expect(setVolume).toHaveBeenCalledOnce();
  });
});

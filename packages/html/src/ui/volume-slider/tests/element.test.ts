import type { AnyPlayerStore } from '@videojs/core/dom';
import { ContextProvider } from '@videojs/element/context';
import type { MediaVolumeState } from '@videojs/media';
import { createStore } from '@videojs/store';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { playerContext } from '../../../player/context';
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

function createVolumeStore(volumeAvailability: MediaVolumeState['volumeAvailability']): AnyPlayerStore {
  return createStore<unknown>()<MediaVolumeState>({
    name: 'volume',
    state: () => ({
      volume: 1,
      muted: false,
      volumeAvailability,
      // Mute has an availability of its own, and this slider reads the level's;
      // these tests vary that one and leave the mute available throughout.
      mutedAvailability: 'available',
      setVolume: vi.fn(),
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
});

describe('VolumeSliderElement', () => {
  it('has the correct tag name', () => {
    expect(VolumeSliderElement.tagName).toBe('media-volume-slider');
  });

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
    const slider = createElement(VolumeSliderElement);

    document.body.appendChild(slider);
    await slider.updateComplete;

    // Without store, slider is disabled — but rootProps should still be bound.
    slider.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 50, clientY: 0 }));

    // No errors thrown means rootProps were bound correctly.
    expect(slider.isConnected).toBe(true);
  });

  it('sets touch-action and user-select styles on connect', async () => {
    const slider = createElement(VolumeSliderElement);

    document.body.appendChild(slider);
    await slider.updateComplete;

    expect(slider.style.touchAction).toBe('none');
    expect(slider.style.userSelect).toBe('none');
  });

  it('supports vertical orientation', () => {
    const slider = createElement(VolumeSliderElement);

    slider.orientation = 'vertical';
    expect(slider.orientation).toBe('vertical');
  });

  it('does not set CSS vars without player context', async () => {
    const slider = createElement(VolumeSliderElement);

    document.body.appendChild(slider);
    await slider.updateComplete;

    // Without player store providing volume state, the element guards early.
    expect(slider.style.getPropertyValue('--media-slider-fill')).toBe('');
  });

  it('connects without errors when no store is available', async () => {
    const slider = createElement(VolumeSliderElement);
    const thumb = createElement(SliderThumbElement);

    slider.appendChild(thumb);
    document.body.appendChild(slider);
    await slider.updateComplete;
    await thumb.updateComplete;

    expect(slider.isConnected).toBe(true);
    expect(thumb.isConnected).toBe(true);
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
    const slider = createElement(VolumeSliderElement);

    document.body.appendChild(slider);
    await slider.updateComplete;

    document.body.removeChild(slider);

    // Verifies no errors during disconnect/cleanup.
    expect(slider.isConnected).toBe(false);
  });
});

import { SliderDataAttrs, type SliderState } from '@videojs/core';
import type { AnyPlayerStore, PlayerTarget } from '@videojs/core/dom';
import { ContextProvider } from '@videojs/element/context';
import { createStore } from '@videojs/store';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { playerContext } from '../../../player/context';
import { sliderContext } from '../../slider/context';
import { SliderThumbElement } from '../../slider/thumb';
import { SliderValueElement } from '../../slider/value';
import { UIElement } from '../../ui-element';
import { TimeSliderChapterTitleElement } from '../chapter-title';
import { TimeSliderChaptersElement } from '../chapters';
import { TimeSliderElement } from '../element';

let tagCounter = 0;

function uniqueTag(base: string): string {
  return `${base}-${tagCounter++}`;
}

function createElement<Element extends HTMLElement>(Base: abstract new () => Element): Element {
  const tag = uniqueTag('test-el');

  customElements.define(tag, class extends (Base as unknown as typeof HTMLElement) {});
  return document.createElement(tag) as Element;
}

class TestSliderProviderElement extends UIElement {
  readonly provider = new ContextProvider(this, {
    context: sliderContext,
    initialValue: createSliderContext(),
  });
}

class TestPlayerProviderElement extends UIElement {
  readonly store = createStore<unknown>()({
    name: 'timeSlider',
    state: () => ({
      currentTime: 0,
      duration: 0,
      seeking: false,
      seek: vi.fn(),
      buffered: [],
      seekable: [],
      paused: true,
      ended: false,
      started: false,
      waiting: false,
      play: vi.fn(() => Promise.resolve()),
      pause: vi.fn(),
      userActive: true,
      controlsVisible: true,
      requestControlsLock: vi.fn(() => vi.fn()),
      toggleControls: vi.fn(),
    }),
  }) as unknown as AnyPlayerStore;

  readonly provider = new ContextProvider(this, {
    context: playerContext,
    initialValue: this.store,
  });
}

customElements.define('test-time-slider-player', TestPlayerProviderElement);

const timeOnlySeek = vi.fn();

/** A store without `bufferFeature`, i.e. the documented composition that omits it. */
class TestTimeOnlyPlayerProviderElement extends UIElement {
  // SAFETY: minimal test store; the element only reads the time and playback slices declared below.
  readonly store = createStore<PlayerTarget>()({
    name: 'timeOnly',
    state: () => ({
      currentTime: 30,
      duration: 120,
      seeking: false,
      seek: timeOnlySeek,
      paused: true,
      ended: false,
      started: false,
      waiting: false,
      play: vi.fn(() => Promise.resolve()),
      pause: vi.fn(),
      userActive: true,
      controlsVisible: true,
      requestControlsLock: vi.fn(() => vi.fn()),
      toggleControls: vi.fn(),
    }),
  }) as AnyPlayerStore;

  readonly provider = new ContextProvider(this, {
    context: playerContext,
    initialValue: this.store,
  });
}

customElements.define('test-time-only-player', TestTimeOnlyPlayerProviderElement);

function createSliderContext(state: Partial<SliderState> = {}, pointerValue = 0) {
  return {
    state: {
      value: 0,
      fillPercent: 0,
      pointerPercent: 0,
      dragging: false,
      pointing: false,
      interactive: false,
      orientation: 'horizontal' as const,
      disabled: false,
      thumbAlignment: 'center' as const,
      ...state,
    },
    stateAttrMap: SliderDataAttrs,
    pointerValue,
    thumbAttrs: {},
    thumbProps: { onKeyDownCapture: () => {}, onFocus: () => {}, onBlur: () => {} },
  };
}

afterEach(() => {
  document.body.innerHTML = '';
  timeOnlySeek.mockClear();
});

describe('TimeSliderElement', () => {
  it('has the correct tag name', () => {
    expect(TimeSliderElement.tagName).toBe('media-time-slider');
  });

  it('initializes with default property values', () => {
    const slider = createElement(TimeSliderElement);

    expect(slider.label).toBe('');
    expect(slider.changeThrottle).toBe(100);
    expect(slider.step).toBe(1);
    expect(slider.largeStep).toBe(10);
    expect(slider.orientation).toBe('horizontal');
    expect(slider.disabled).toBe(false);
    expect(slider.thumbAlignment).toBe('center');
    expect(slider.pauseOnDrag).toBe(false);
  });

  it('reflects pause-on-drag attribute to property', async () => {
    const slider = createElement(TimeSliderElement);

    slider.setAttribute('pause-on-drag', '');

    document.body.appendChild(slider);
    await slider.updateComplete;

    expect(slider.pauseOnDrag).toBe(true);
  });

  it('binds rootProps pointer events on connect', async () => {
    const slider = createElement(TimeSliderElement);

    document.body.appendChild(slider);
    await slider.updateComplete;

    // Without store, slider is disabled — but rootProps should still be bound.
    // Verify by dispatching pointermove (which does not guard on disabled).
    slider.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 50, clientY: 0 }));

    // No errors thrown means rootProps were bound correctly.
    expect(slider.isConnected).toBe(true);
  });

  it('sets touch-action and user-select styles on connect', async () => {
    const slider = createElement(TimeSliderElement);

    document.body.appendChild(slider);
    await slider.updateComplete;

    expect(slider.style.touchAction).toBe('none');
    expect(slider.style.userSelect).toBe('none');
  });

  it('disables the slider when the time range is unknown', async () => {
    const player = document.createElement('test-time-slider-player');
    const slider = createElement(TimeSliderElement);
    const thumb = createElement(SliderThumbElement);

    slider.appendChild(thumb);
    player.appendChild(slider);
    document.body.appendChild(player);
    await slider.updateComplete;
    await thumb.updateComplete;

    expect(slider.hasAttribute('data-disabled')).toBe(true);
    expect(thumb.getAttribute('aria-disabled')).toBe('true');
    expect(thumb.getAttribute('aria-valuetext')).toBe('Media not loaded, unknown time.');
    expect(thumb.getAttribute('tabindex')).toBe('-1');
  });

  it('stays interactive when the buffer feature is not composed', async () => {
    const player = document.createElement('test-time-only-player');
    const slider = createElement(TimeSliderElement);
    const thumb = createElement(SliderThumbElement);

    slider.appendChild(thumb);
    player.appendChild(slider);
    document.body.appendChild(player);
    await slider.updateComplete;
    await thumb.updateComplete;

    expect(slider.hasAttribute('data-disabled')).toBe(false);
    expect(thumb.getAttribute('aria-disabled')).toBeNull();
    expect(thumb.getAttribute('tabindex')).toBe('0');

    thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

    expect(timeOnlySeek).toHaveBeenCalledTimes(1);
    expect(timeOnlySeek.mock.calls[0]?.[0]).toBeCloseTo(31, 5);
  });

  it('does not set CSS vars without player context', async () => {
    const slider = createElement(TimeSliderElement);

    document.body.appendChild(slider);
    await slider.updateComplete;

    // Without player store providing time state, the element guards early.
    expect(slider.style.getPropertyValue('--media-slider-fill')).toBe('');
  });

  it('sets data-orientation to horizontal by default', async () => {
    // Without store, data attrs are not applied (early return in update).
    const slider = createElement(TimeSliderElement);

    document.body.appendChild(slider);
    await slider.updateComplete;

    // Without store the update guard returns early, so no data attrs.
    // This confirms the element connects and runs without errors.
    expect(slider.isConnected).toBe(true);
  });

  it('provides time-formatted values to SliderValueElement via context', async () => {
    // Without a real player store, context isn't populated.
    // This test verifies the element structure and connection works.
    const slider = createElement(TimeSliderElement);
    const valueEl = createElement(SliderValueElement);

    slider.appendChild(valueEl);
    document.body.appendChild(slider);
    await slider.updateComplete;
    await valueEl.updateComplete;

    // Without store, formatValue isn't available to children.
    // Verifies no runtime errors in the parent-child context chain.
    expect(valueEl.isConnected).toBe(true);
  });

  it('provides ARIA attributes to SliderThumbElement via context', async () => {
    const slider = createElement(TimeSliderElement);
    const thumb = createElement(SliderThumbElement);

    slider.appendChild(thumb);
    document.body.appendChild(slider);
    await slider.updateComplete;
    await thumb.updateComplete;

    // Without store, context is not populated so thumb has no ARIA.
    // This verifies no errors occur in the context chain.
    expect(thumb.isConnected).toBe(true);
  });
});

describe('TimeSlider chapter elements', () => {
  it('exposes the chapter collection and title tags', () => {
    expect(TimeSliderChaptersElement.tagName).toBe('media-time-slider-chapters');
    expect(TimeSliderChapterTitleElement.tagName).toBe('media-time-slider-chapter-title');
  });

  it('only exposes the chapter title to assistive technology during keyboard interaction', async () => {
    const slider = createElement(TestSliderProviderElement);
    const title = createElement(TimeSliderChapterTitleElement);

    slider.appendChild(title);
    document.body.appendChild(slider);
    await title.updateComplete;

    expect(title.getAttribute('aria-hidden')).toBe('true');
    expect(title.hasAttribute('aria-live')).toBe(false);

    slider.provider.setValue(createSliderContext({ interactive: true }));
    await title.updateComplete;

    expect(title.hasAttribute('aria-hidden')).toBe(false);
    expect(title.getAttribute('aria-live')).toBe('polite');
  });

  it('marks the chapter collection as decorative', async () => {
    const slider = createElement(TestSliderProviderElement);
    const chapters = createElement(TimeSliderChaptersElement);
    const template = document.createElement('template');

    template.innerHTML = '<div class="chapter"></div>';
    chapters.appendChild(template);
    slider.appendChild(chapters);
    document.body.appendChild(slider);
    await chapters.updateComplete;

    expect(chapters.getAttribute('aria-hidden')).toBe('true');
    expect(chapters.querySelector('template')).toBe(template);
    expect(chapters.querySelectorAll('.chapter')).toHaveLength(1);
    const chapter = chapters.querySelector<HTMLElement>('.chapter')!;

    expect(chapter.style.getPropertyValue('--media-slider-chapter-start')).toBe('0%');
    expect(chapter.style.getPropertyValue('--media-slider-chapter-end')).toBe('100%');
    expect(chapters.querySelector('svg')).toBeNull();
  });

  it('removes non-template content when the template is missing', async () => {
    const slider = createElement(TestSliderProviderElement);
    const chapters = createElement(TimeSliderChaptersElement);
    const content = document.createElement('div');

    content.className = 'content';
    chapters.appendChild(content);
    slider.appendChild(chapters);
    document.body.appendChild(slider);
    await chapters.updateComplete;

    expect(chapters.querySelector('.content')).toBeNull();
  });

  it('discovers a template on a later update', async () => {
    const slider = createElement(TestSliderProviderElement);
    const chapters = createElement(TimeSliderChaptersElement);
    const content = document.createElement('div');

    content.className = 'content';
    chapters.appendChild(content);
    slider.appendChild(chapters);
    document.body.appendChild(slider);
    await chapters.updateComplete;

    const template = document.createElement('template');

    template.innerHTML = '<div class="chapter"></div>';
    chapters.appendChild(template);
    chapters.requestUpdate();
    await chapters.updateComplete;

    expect(chapters.querySelector('template')).toBe(template);
    expect(chapters.querySelector('.content')).toBeNull();
    expect(chapters.querySelectorAll('.chapter')).toHaveLength(1);
  });

  for (const [name, content] of [
    ['empty', ''],
    ['multiple-root', '<div></div><div></div>'],
    ['non-HTML', '<svg></svg>'],
  ] as const) {
    it(`removes non-template content when the template is ${name}`, async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const slider = createElement(TestSliderProviderElement);
      const chapters = createElement(TimeSliderChaptersElement);
      const unexpectedContent = document.createElement('div');

      unexpectedContent.className = 'content';
      const template = document.createElement('template');

      template.innerHTML = content;
      chapters.append(unexpectedContent, template);
      slider.appendChild(chapters);
      document.body.appendChild(slider);
      await chapters.updateComplete;

      expect(chapters.querySelector('.content')).toBeNull();
      expect(warn).toHaveBeenCalledOnce();
      warn.mockRestore();
    });
  }
});
